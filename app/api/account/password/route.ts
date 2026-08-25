import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(200) });

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const parsed = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) return NextResponse.redirect(appUrl("/settings?password=invalid"), 303);

  const full = await prisma.user.findUnique({ where: { id: user.id } });
  if (!full || !(await bcrypt.compare(parsed.data.currentPassword, full.passwordHash))) {
    return NextResponse.redirect(appUrl("/settings?password=wrong"), 303);
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  return NextResponse.redirect(appUrl("/login?reset=ok"), 303);
}
