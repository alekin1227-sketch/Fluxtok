import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){assertSameOrigin(req);const admin=await requireCompanyAdmin();const {id}=await params;const member=await prisma.user.findFirst({where:{id,companyId:admin.companyId}});if(member&&member.id!==admin.id)await prisma.user.update({where:{id:member.id},data:{active:!member.active}});return NextResponse.redirect(appUrl("/team?saved=1"),303);}
