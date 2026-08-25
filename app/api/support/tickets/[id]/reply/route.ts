import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyIdentity } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";
import { sendSupportNotification } from "@/lib/mail";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  const user = await requireCompanyIdentity();
  const { id } = await params;
  const f = await req.formData();
  const parsed = z.object({ message: z.string().trim().min(2).max(6000) }).safeParse(Object.fromEntries(f));
  if (!parsed.success) return NextResponse.redirect(appUrl(`/support/${id}?error=invalid`), 303);
  const ticket = await prisma.supportTicket.findFirst({ where: { id, companyId: user.companyId } });
  if (!ticket || ticket.status === "CLOSED") return NextResponse.redirect(appUrl("/support"), 303);
  await prisma.$transaction([
    prisma.supportMessage.create({ data: { ticketId: id, authorUserId: user.id, sender: "CUSTOMER", message: parsed.data.message } }),
    prisma.supportTicket.update({ where: { id }, data: { status: "WAITING_SUPPORT", lastMessageAt: new Date() } }),
  ]);
  const settings = await getPlatformSettings();
  if (settings.notificationEmail) await sendSupportNotification({ to: settings.notificationEmail, company: user.company.name, subject: ticket.subject, customerEmail: user.email, message: parsed.data.message, ticketUrl: appUrl(`/superadmin/suporte/${id}`).toString() }).catch((e) => console.error("support notification", e));
  return NextResponse.redirect(appUrl(`/support/${id}`), 303);
}
