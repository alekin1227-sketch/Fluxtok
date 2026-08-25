import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

const optionalEmail = z.preprocess((v) => v === "" ? undefined : v, z.string().email().optional());
const schema = z.object({ supportName: z.string().trim().min(2).max(120), supportEmail: optionalEmail, notificationEmail: optionalEmail });

export async function POST(req: NextRequest) {
  assertSameOrigin(req); await requireSuperadmin(); const f = await req.formData(); const parsed = schema.safeParse(Object.fromEntries(f));
  if (!parsed.success) return NextResponse.redirect(appUrl("/superadmin/configuracoes?error=invalid"), 303);
  await prisma.platformSetting.upsert({ where: { id: "global" }, create: { id: "global", supportName: parsed.data.supportName, supportEmail: parsed.data.supportEmail || null, notificationEmail: parsed.data.notificationEmail || null }, update: { supportName: parsed.data.supportName, supportEmail: parsed.data.supportEmail || null, notificationEmail: parsed.data.notificationEmail || null } });
  return NextResponse.redirect(appUrl("/superadmin/configuracoes?saved=1"), 303);
}
