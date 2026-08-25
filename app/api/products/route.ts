import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { optionalHttpUrl } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

const optionalMoney = z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().nonnegative().optional());
const schema = z.object({
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
  const p = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!p.success) return NextResponse.redirect(appUrl("/products?error=invalid#novo"), 303);

  const d = p.data;
  await prisma.product.create({
    data: {
      companyId: user.companyId,
      name: d.name,
      sku: d.sku || null,
      photoUrl: d.photoUrl || null,
      cost: d.cost ?? null,
      tiktokUrl: d.tiktokUrl || null,
      active: d.active === "true",
    },
  });
  return NextResponse.redirect(appUrl("/products?created=1"), 303);
}
