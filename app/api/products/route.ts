import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { optionalHttpUrl } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { audit } from "@/lib/audit";

const optionalMoney = z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().nonnegative().optional());
const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sku: z.string().trim().max(80).optional(),
  photoUrl: optionalHttpUrl,
  cost: optionalMoney,
  tiktokUrl: optionalHttpUrl,
  active: z.enum(["true", "false"]),
});

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const f = await req.formData();
  const intent = String(f.get("intent") || "create");

  if (intent === "delete") {
    const id = String(f.get("id") || "");
    const product = await prisma.product.findFirst({
      where: { id, companyId: user.companyId },
      include: { _count: { select: { samples: true, contents: true } } },
    });
    if (!product) return NextResponse.redirect(appUrl("/products?error=notfound"), 303);

    if (product._count.samples > 0 || product._count.contents > 0) {
      await prisma.product.update({ where: { id: product.id }, data: { active: false } });
      await audit({ companyId: user.companyId, userId: user.id, action: "PRODUCT_ARCHIVED", entity: "product", entityId: product.id });
      return NextResponse.redirect(appUrl("/products?archived=1"), 303);
    }

    await prisma.product.delete({ where: { id: product.id } });
    await audit({ companyId: user.companyId, userId: user.id, action: "PRODUCT_DELETED", entity: "product", entityId: product.id });
    return NextResponse.redirect(appUrl("/products?deleted=1"), 303);
  }

  const parsed = productSchema.safeParse(Object.fromEntries(f));
  if (!parsed.success) return NextResponse.redirect(appUrl("/products?error=invalid#novo"), 303);
  const d = parsed.data;

  if (intent === "update") {
    const id = String(f.get("id") || "");
    const product = await prisma.product.findFirst({ where: { id, companyId: user.companyId }, select: { id: true } });
    if (!product) return NextResponse.redirect(appUrl("/products?error=notfound"), 303);
    await prisma.product.update({ where: { id }, data: {
      name: d.name,
      sku: d.sku || null,
      photoUrl: d.photoUrl || null,
      cost: d.cost ?? null,
      tiktokUrl: d.tiktokUrl || null,
      active: d.active === "true",
    } });
    await audit({ companyId: user.companyId, userId: user.id, action: "PRODUCT_UPDATED", entity: "product", entityId: id });
    return NextResponse.redirect(appUrl("/products?updated=1"), 303);
  }

  const product = await prisma.product.create({ data: {
    companyId: user.companyId,
    name: d.name,
    sku: d.sku || null,
    photoUrl: d.photoUrl || null,
    cost: d.cost ?? null,
    tiktokUrl: d.tiktokUrl || null,
    active: d.active === "true",
  } });
  await audit({ companyId: user.companyId, userId: user.id, action: "PRODUCT_CREATED", entity: "product", entityId: product.id });
  return NextResponse.redirect(appUrl("/products?created=1"), 303);
}
