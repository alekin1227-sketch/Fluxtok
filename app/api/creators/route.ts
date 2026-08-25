import { NextRequest, NextResponse } from "next/server";
import { CreatorStatus } from "@prisma/client";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { optionalHttpUrl } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

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

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const p = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!p.success) return NextResponse.redirect(appUrl("/creators?error=invalid#novo"), 303);

  const d = p.data;
  const handle = d.handle.startsWith("@") ? d.handle : `@${d.handle}`;
  const duplicate = await prisma.creator.findFirst({ where: { companyId: user.companyId, handle } });
  if (duplicate) return NextResponse.redirect(appUrl("/creators?error=duplicate#novo"), 303);

  await prisma.creator.create({
    data: {
      companyId: user.companyId,
      name: d.name,
      handle,
      profileUrl: d.profileUrl || null,
      niche: d.niche || null,
      followers: d.followers ?? null,
      contact: d.contact || null,
      contactOrigin: d.contactOrigin || null,
      status: d.status,
      notes: d.notes || null,
    },
  });
  return NextResponse.redirect(appUrl("/creators?created=1"), 303);
}
