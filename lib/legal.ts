import crypto from "crypto";
import { LegalDocument, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const LEGAL_VERSION = "2026-08-25-v1";

export function hashIp(ip?: string | null) {
  if (!ip) return null;
  const secret = process.env.SESSION_SECRET || "fluxtok-local";
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

export function requestLegalMeta(headers: Headers) {
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
  return {
    ipHash: hashIp(ip),
    userAgent: headers.get("user-agent")?.slice(0, 2000) || null,
  };
}

export async function saveAcceptances(args: {
  tx: PrismaClient | any;
  companyId: string;
  userId: string;
  documents: LegalDocument[];
  headers: Headers;
}) {
  const meta = requestLegalMeta(args.headers);
  await args.tx.legalAcceptance.createMany({
    data: args.documents.map((document) => ({
      companyId: args.companyId,
      userId: args.userId,
      document,
      version: LEGAL_VERSION,
      ...meta,
    })),
  });
}


export const REQUIRED_ACCOUNT_DOCUMENTS = [
  LegalDocument.TERMS,
  LegalDocument.PRIVACY,
  LegalDocument.TRIAL,
  LegalDocument.DATA_PROCESSING,
] as const;

export async function hasCurrentRequiredAcceptances(userId: string) {
  const rows = await prisma.legalAcceptance.findMany({
    where: { userId, version: LEGAL_VERSION, document: { in: [...REQUIRED_ACCOUNT_DOCUMENTS] } },
    select: { document: true },
  });
  return new Set(rows.map((row) => row.document)).size === REQUIRED_ACCOUNT_DOCUMENTS.length;
}
