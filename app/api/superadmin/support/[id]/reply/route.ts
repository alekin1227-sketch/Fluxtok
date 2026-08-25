import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";
import { sendSupportReply } from "@/lib/mail";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  const admin = await requireSuperadmin();
  const { id } = await params;
  const f = await req.formData();
  const parsed = z.object({ message: z.string().trim().min(2).max(6000) }).safeParse(Object.fromEntries(f));
  if (!parsed.success) return NextResponse.redirect(appUrl(`/superadmin/suporte/${id}?error=invalid`), 303);
  const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: { createdBy: true, company: true } });
  if (!ticket) return NextResponse.redirect(appUrl("/superadmin/suporte"), 303);
  await prisma.$transaction([
    prisma.supportMessage.create({ data: { ticketId: id, authorUserId: admin.id, sender: "SUPPORT", message: parsed.data.message } }),
    prisma.supportTicket.update({ where: { id }, data: { status: "WAITING_CUSTOMER", lastMessageAt: new Date() } }),
  ]);
  await audit({ companyId: ticket.companyId, userId: admin.id, action: "SUPPORT_REPLY_SENT", entity: "support_ticket", entityId: id });
  const settings = await getPlatformSettings();
  await sendSupportReply({ to: ticket.createdBy.email, supportName: settings.supportName, subject: ticket.subject, message: parsed.data.message, ticketUrl: appUrl(`/support/${id}`).toString(), replyTo: settings.supportEmail }).catch((e) => console.error("support reply email", e));
  return NextResponse.redirect(appUrl(`/superadmin/suporte/${id}?sent=1`), 303);
}
