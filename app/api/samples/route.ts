import { NextRequest, NextResponse } from "next/server";
import { SampleStatus } from "@prisma/client";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanySettings, parseDate } from "@/lib/tenant";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

const schema = z.object({
  creatorId: z.string().min(1),
  productId: z.string().min(1),
  campaignId: z.string().optional(),
  trackingCode: z.string().trim().max(120).optional(),
  carrier: z.string().trim().max(120).optional(),
  status: z.nativeEnum(SampleStatus),
  notes: z.string().trim().max(4000).optional(),
});

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const f = await req.formData();
  const p = schema.safeParse(Object.fromEntries(f));
  if (!p.success) return NextResponse.redirect(appUrl("/samples?error=invalid#novo"), 303);

  const [creator, product, campaign, settings] = await Promise.all([
    prisma.creator.findFirst({ where: { id: p.data.creatorId, companyId: user.companyId } }),
    prisma.product.findFirst({ where: { id: p.data.productId, companyId: user.companyId } }),
    p.data.campaignId ? prisma.campaign.findFirst({ where: { id: p.data.campaignId, companyId: user.companyId } }) : Promise.resolve(null),
    getCompanySettings(user.companyId),
  ]);
  if (!creator || !product || (p.data.campaignId && !campaign)) return NextResponse.redirect(appUrl("/samples?error=relation#novo"), 303);

  let receivedAt = parseDate(f.get("receivedAt"));
  if (!receivedAt && (p.data.status === SampleStatus.RECEIVED || p.data.status === SampleStatus.WAITING_CONTENT)) {
    receivedAt = new Date();
  }

  let contentDueAt = parseDate(f.get("contentDueAt"));
  if (!contentDueAt && receivedAt) {
    contentDueAt = new Date(receivedAt.getTime() + settings.defaultContentDays * 86400000);
  }

  await prisma.sample.create({
    data: {
      companyId: user.companyId,
      creatorId: creator.id,
      productId: product.id,
      campaignId: campaign?.id || null,
      sentAt: parseDate(f.get("sentAt")),
      trackingCode: p.data.trackingCode || null,
      carrier: p.data.carrier || null,
      expectedAt: parseDate(f.get("expectedAt")),
      receivedAt,
      contentDueAt,
      status: p.data.status,
      statusChangedAt: new Date(),
      notes: p.data.notes || null,
    },
  });
  return NextResponse.redirect(appUrl("/samples?created=1"), 303);
}
