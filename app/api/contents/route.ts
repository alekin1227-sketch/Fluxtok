import { NextRequest, NextResponse } from "next/server";
import { ContentKind } from "@prisma/client";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/tenant";
import { requiredHttpUrl } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { audit } from "@/lib/audit";
import { extractTikTokVideoId } from "@/lib/integrations/tiktok/display";

const optionalInt = z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().int().nonnegative().optional());
const optionalMoney = z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().nonnegative().optional());
const createSchema = z.object({
  sampleId: z.string().min(1),
  kind: z.nativeEnum(ContentKind),
  url: requiredHttpUrl,
  views: optionalInt,
  sales: optionalInt,
  revenue: optionalMoney,
  notes: z.string().trim().max(4000).optional(),
});
const updateSchema = z.object({
  id: z.string().min(1),
  kind: z.nativeEnum(ContentKind),
  url: requiredHttpUrl,
  views: optionalInt,
  sales: optionalInt,
  revenue: optionalMoney,
  notes: z.string().trim().max(4000).optional(),
});

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const f = await req.formData();
  const intent = String(f.get("intent") || "create");

  if (intent === "delete") {
    const id = String(f.get("id") || "");
    const content = await prisma.content.findFirst({ where: { id, companyId: user.companyId }, select: { id: true, sampleId: true } });
    if (!content) return NextResponse.redirect(appUrl("/contents?error=notfound"), 303);
    await prisma.$transaction(async (tx) => {
      await tx.content.delete({ where: { id: content.id } });
      if (content.sampleId) {
        const remaining = await tx.content.count({ where: { sampleId: content.sampleId, companyId: user.companyId } });
        if (remaining === 0) {
          await tx.sample.updateMany({ where: { id: content.sampleId, companyId: user.companyId, status: "CONTENT_PUBLISHED" }, data: { status: "WAITING_CONTENT", statusChangedAt: new Date() } });
        }
      }
    });
    await audit({ companyId: user.companyId, userId: user.id, action: "CONTENT_DELETED", entity: "content", entityId: id });
    return NextResponse.redirect(appUrl("/contents?deleted=1"), 303);
  }

  const publishedAt = parseDate(f.get("publishedAt"));
  if (intent === "update") {
    const p = updateSchema.safeParse(Object.fromEntries(f));
    if (!p.success || !publishedAt) return NextResponse.redirect(appUrl("/contents?error=invalid"), 303);
    const content = await prisma.content.findFirst({ where: { id: p.data.id, companyId: user.companyId }, select: { id: true } });
    if (!content) return NextResponse.redirect(appUrl("/contents?error=notfound"), 303);
    await prisma.content.update({ where: { id: content.id }, data: {
      kind: p.data.kind,
      publishedAt,
      url: p.data.url,
      tiktokContentId: extractTikTokVideoId(p.data.url),
      views: p.data.views ?? null,
      sales: p.data.sales ?? null,
      revenue: p.data.revenue ?? null,
      notes: p.data.notes || null,
    } });
    await audit({ companyId: user.companyId, userId: user.id, action: "CONTENT_UPDATED", entity: "content", entityId: content.id });
    return NextResponse.redirect(appUrl("/contents?updated=1"), 303);
  }

  const p = createSchema.safeParse(Object.fromEntries(f));
  if (!p.success || !publishedAt) return NextResponse.redirect(appUrl("/contents?error=invalid#novo"), 303);
  const sample = await prisma.sample.findFirst({ where: { id: p.data.sampleId, companyId: user.companyId } });
  if (!sample) return NextResponse.redirect(appUrl("/contents?error=sample#novo"), 303);

  const created = await prisma.$transaction(async (tx) => {
    const content = await tx.content.create({ data: {
      companyId: user.companyId,
      creatorId: sample.creatorId,
      productId: sample.productId,
      sampleId: sample.id,
      tiktokContentId: extractTikTokVideoId(p.data.url),
      kind: p.data.kind,
      publishedAt,
      url: p.data.url,
      views: p.data.views ?? null,
      sales: p.data.sales ?? null,
      revenue: p.data.revenue ?? null,
      notes: p.data.notes || null,
    } });
    await tx.sample.update({ where: { id: sample.id }, data: { status: "CONTENT_PUBLISHED", statusChangedAt: new Date() } });
    return content;
  });
  await audit({ companyId: user.companyId, userId: user.id, action: "CONTENT_CREATED", entity: "content", entityId: created.id });
  return NextResponse.redirect(appUrl("/contents?created=1"), 303);
}
