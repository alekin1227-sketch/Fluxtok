import { NextRequest, NextResponse } from "next/server";
import { CreatorStatus } from "@prisma/client";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { optionalHttpUrl } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { audit } from "@/lib/audit";

const optionalInt = z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().int().nonnegative().optional());
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  handle: z.string().trim().min(2).max(80),
  profileUrl: optionalHttpUrl,
  niche: z.string().trim().max(80).optional(),
  followers: optionalInt,
  contact: z.string().trim().max(150).optional(),
  contactOrigin: z.string().trim().max(120).optional(),
  status: z.nativeEnum(CreatorStatus),
  notes: z.string().trim().max(4000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const { id } = await params;
  const f = await req.formData();
  const intent = String(f.get("intent") || "update");
  const creator = await prisma.creator.findFirst({ where: { id, companyId: user.companyId }, include: { _count: { select: { samples: true, contents: true } } } });
  if (!creator) return NextResponse.redirect(appUrl("/creators?error=notfound"), 303);

  if (intent === "delete") {
    if (creator._count.samples > 0 || creator._count.contents > 0) {
      await prisma.creator.update({ where: { id }, data: { status: CreatorStatus.FINISHED } });
      await audit({ companyId: user.companyId, userId: user.id, action: "CREATOR_FINISHED", entity: "creator", entityId: id });
      return NextResponse.redirect(appUrl(`/creators/${id}?archived=1`), 303);
    }
    await prisma.creator.delete({ where: { id } });
    await audit({ companyId: user.companyId, userId: user.id, action: "CREATOR_DELETED", entity: "creator", entityId: id });
    return NextResponse.redirect(appUrl("/creators?deleted=1"), 303);
  }

  const parsed = schema.safeParse(Object.fromEntries(f));
  if (!parsed.success) return NextResponse.redirect(appUrl(`/creators/${id}?error=invalid#editar`), 303);
  const d = parsed.data;
  const handle = d.handle.startsWith("@") ? d.handle : `@${d.handle}`;
  const duplicate = await prisma.creator.findFirst({ where: { companyId: user.companyId, handle, id: { not: id } }, select: { id: true } });
  if (duplicate) return NextResponse.redirect(appUrl(`/creators/${id}?error=duplicate#editar`), 303);

  await prisma.creator.update({ where: { id }, data: {
    name: d.name,
    handle,
    profileUrl: d.profileUrl || null,
    niche: d.niche || null,
    followers: d.followers ?? null,
    contact: d.contact || null,
    contactOrigin: d.contactOrigin || null,
    status: d.status,
    notes: d.notes || null,
  } });
  await audit({ companyId: user.companyId, userId: user.id, action: "CREATOR_UPDATED", entity: "creator", entityId: id });
  return NextResponse.redirect(appUrl(`/creators/${id}?updated=1`), 303);
}
