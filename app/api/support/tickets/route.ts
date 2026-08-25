import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyIdentity } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";
import { sendSupportNotification } from "@/lib/mail";
import { audit } from "@/lib/audit";

const schema = z.object({ subject: z.string().trim().min(3).max(160), category: z.string().trim().min(2).max(80), message: z.string().trim().min(10).max(6000) });

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyIdentity();
  const f = await req.formData();
  const parsed = schema.safeParse(Object.fromEntries(f));
  if (!parsed.success) return NextResponse.redirect(appUrl("/support?error=invalid"), 303);
  const ticket = await prisma.$transaction(async (tx) => {
    const t = await tx.supportTicket.create({ data: { companyId: user.companyId, createdById: user.id, subject: parsed.data.subject, category: parsed.data.category, status: "WAITING_SUPPORT" } });
    await tx.supportMessage.create({ data: { ticketId: t.id, authorUserId: user.id, sender: "CUSTOMER", message: parsed.data.message } });
    return t;
  });
  await audit({ companyId: user.companyId, userId: user.id, action: "SUPPORT_TICKET_CREATED", entity: "support_ticket", entityId: ticket.id });
  const settings = await getPlatformSettings();
  if (settings.notificationEmail) await sendSupportNotification({ to: settings.notificationEmail, company: user.company.name, subject: ticket.subject, customerEmail: user.email, message: parsed.data.message, ticketUrl: appUrl(`/superadmin/suporte/${ticket.id}`).toString() }).catch((e) => console.error("support notification", e));
  return NextResponse.redirect(appUrl(`/support/${ticket.id}?created=1`), 303);
}
