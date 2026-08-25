import { NextRequest, NextResponse } from "next/server";
import { SupportTicketStatus } from "@prisma/client";
import { requireSuperadmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req); await requireSuperadmin(); const { id } = await params; const f = await req.formData();
  const raw = String(f.get("status") || "");
  if (!Object.values(SupportTicketStatus).includes(raw as SupportTicketStatus)) return NextResponse.redirect(appUrl(`/superadmin/suporte/${id}?error=status`), 303);
  await prisma.supportTicket.update({ where: { id }, data: { status: raw as SupportTicketStatus, lastMessageAt: new Date() } }).catch(() => undefined);
  return NextResponse.redirect(appUrl(`/superadmin/suporte/${id}`), 303);
}
