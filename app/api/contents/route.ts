import { NextRequest, NextResponse } from "next/server";
import { ContentKind } from "@prisma/client";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/tenant";
import { requiredHttpUrl } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

const optionalInt = z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().int().nonnegative().optional());
const optionalMoney = z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().nonnegative().optional());
const schema = z.object({
  sampleId: z.string().min(1),
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
  const p = schema.safeParse(Object.fromEntries(f));
  const publishedAt = parseDate(f.get("publishedAt"));
  if (!p.success || !publishedAt) return NextResponse.redirect(appUrl("/contents?error=invalid#novo"), 303);

  const sample = await prisma.sample.findFirst({ where: { id: p.data.sampleId, companyId: user.companyId } });
  if (!sample) return NextResponse.redirect(appUrl("/contents?error=sample#novo"), 303);

  await prisma.$transaction([
    prisma.content.create({
      data: {
        companyId: user.companyId,
        creatorId: sample.creatorId,
        productId: sample.productId,
        sampleId: sample.id,
        kind: p.data.kind,
        publishedAt,
        url: p.data.url,
        views: p.data.views ?? null,
        sales: p.data.sales ?? null,
        revenue: p.data.revenue ?? null,
        notes: p.data.notes || null,
      },
    }),
    prisma.sample.update({ where: { id: sample.id }, data: { status: "CONTENT_PUBLISHED", statusChangedAt: new Date() } }),
  ]);

  return NextResponse.redirect(appUrl("/contents?created=1"), 303);
}
