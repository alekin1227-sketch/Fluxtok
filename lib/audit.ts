import { prisma } from "@/lib/prisma";

export async function audit(args: { companyId?: string | null; userId?: string | null; action: string; entity?: string; entityId?: string; metadata?: unknown }) {
  await prisma.auditLog.create({
    data: {
      companyId: args.companyId ?? null,
      userId: args.userId ?? null,
      action: args.action,
      entity: args.entity ?? null,
      entityId: args.entityId ?? null,
      metadata: args.metadata === undefined ? null : JSON.stringify(args.metadata),
    },
  }).catch(() => undefined);
}
