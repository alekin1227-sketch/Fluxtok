import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireCompanyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

const schema=z.object({name:z.string().trim().min(2).max(120),email:z.string().trim().toLowerCase().email(),password:z.string().min(12).max(200)});
export async function POST(req:NextRequest){assertSameOrigin(req);const admin=await requireCompanyAdmin();const f=await req.formData();const p=schema.safeParse(Object.fromEntries(f));if(!p.success)return NextResponse.redirect(appUrl("/team?error=1#novo"),303);const sub=admin.company.subscription;const count=await prisma.user.count({where:{companyId:admin.companyId}});if(sub?.plan==="STARTER"&&count>=3)return NextResponse.redirect(appUrl("/team?error=limit"),303);try{await prisma.user.create({data:{companyId:admin.companyId,name:p.data.name,email:p.data.email,passwordHash:await bcrypt.hash(p.data.password,12),role:"MEMBER"}});return NextResponse.redirect(appUrl("/team?created=1"),303);}catch(e){console.error(e);return NextResponse.redirect(appUrl("/team?error=1#novo"),303);}}
