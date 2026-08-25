import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { uniqueCompanySlug } from "@/lib/slug";

const schema=z.object({name:z.string().trim().min(2).max(150),adminName:z.string().trim().min(2).max(120),adminEmail:z.string().trim().toLowerCase().email(),adminPassword:z.string().min(12).max(200)});
export async function POST(req:NextRequest){assertSameOrigin(req);await requireSuperadmin();const f=await req.formData();const p=schema.safeParse(Object.fromEntries(f));if(!p.success)return NextResponse.redirect(appUrl("/superadmin/empresas?error=invalid#nova-empresa"),303);const d=p.data;const now=new Date();const trialEndsAt=new Date(now.getTime()+7*86400000);try{const hash=await bcrypt.hash(d.adminPassword,12);const slug=await uniqueCompanySlug(d.name);await prisma.$transaction(async tx=>{const company=await tx.company.create({data:{name:d.name,slug,settings:{create:{}},trial:{create:{trialEndsAt}},subscription:{create:{status:"TRIALING",plan:"STARTER",trialStartsAt:now,trialEndsAt}}}});await tx.user.create({data:{companyId:company.id,name:d.adminName,email:d.adminEmail,passwordHash:hash,role:"COMPANY_ADMIN"}});});}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002")return NextResponse.redirect(appUrl("/superadmin/empresas?error=duplicate#nova-empresa"),303);console.error(error);return NextResponse.redirect(appUrl("/superadmin/empresas?error=server#nova-empresa"),303);}return NextResponse.redirect(appUrl("/superadmin/empresas?created=1"),303);}
