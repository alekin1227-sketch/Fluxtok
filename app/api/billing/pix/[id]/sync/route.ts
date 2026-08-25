import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdminIdentity } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { applyMercadoPagoPixPayment, getMercadoPagoPayment } from "@/lib/pix";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  const user = await requireCompanyAdminIdentity();
  const { id } = await params;

  const local = await prisma.pixPayment.findFirst({ where: { id, companyId: user.companyId } });
  if (!local?.externalPaymentId) return NextResponse.redirect(appUrl(`/billing/pix/${id}?error=sync`), 303);

  try {
    const payment = await getMercadoPagoPayment(local.externalPaymentId);
    await applyMercadoPagoPixPayment(payment, user.id);
    return NextResponse.redirect(appUrl(`/billing/pix/${id}?synced=1`), 303);
  } catch (error) {
    console.error("billing pix sync", error);
    return NextResponse.redirect(appUrl(`/billing/pix/${id}?error=sync`), 303);
  }
}
