import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/tenant";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

const schema=z.object({name:z.string().trim().min(2).max(150),productId:z.string().optional(),objective:z.string().trim().max(500).optional()});
export async function POST(req:NextRequest){assertSameOrigin(req);const user=await requireCompanyUser();const f=await req.formData();const p=schema.safeParse(Object.fromEntries(f));if(!p.success)return NextResponse.redirect(appUrl("/campaigns?error=1#nova"),303);let productId:string|null=null;if(p.data.productId){const product=await prisma.product.findFirst({where:{id:p.data.productId,companyId:user.companyId}});if(!product)return NextResponse.redirect(appUrl("/campaigns?error=1#nova"),303);productId=product.id;}await prisma.campaign.create({data:{companyId:user.companyId,name:p.data.name,productId,objective:p.data.objective||null,startsAt:parseDate(f.get("startsAt")),endsAt:parseDate(f.get("endsAt")),status:"ACTIVE"}});return NextResponse.redirect(appUrl("/campaigns?created=1"),303);}
