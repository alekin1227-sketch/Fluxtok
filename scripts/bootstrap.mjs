import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function repairInterruptedPixPlanChanges() {
  const now = new Date();
  const broken = await prisma.subscription.findMany({
    where: {
      status: "TRIALING",
      provider: "mercadopago",
      externalSubscriptionId: { not: null },
      currentPeriodEnd: { gt: now },
    },
  });

  let repaired = 0;
  for (const sub of broken) {
    const latestPaidPix = await prisma.pixPayment.findFirst({
      where: { companyId: sub.companyId, status: "approved", approvedAt: { not: null } },
      orderBy: { approvedAt: "desc" },
    });
    if (!latestPaidPix) continue;

    await prisma.subscription.update({
      where: { companyId: sub.companyId },
      data: {
        status: "ACTIVE",
        plan: latestPaidPix.plan,
        amount: latestPaidPix.amount,
        provider: "mercadopago_pix",
        externalSubscriptionId: null,
        trialEndsAt: now,
        pendingPlan: sub.plan,
        pendingAmount: sub.amount,
        pendingProvider: "mercadopago",
        pendingExternalSubscriptionId: sub.externalSubscriptionId,
        pendingCreatedAt: sub.updatedAt,
      },
    });
    repaired += 1;
  }

  if (repaired) console.log(`[Fluxtok] ${repaired} assinatura(s) paga(s) restaurada(s) após bug legado de troca de plano.`);
}

async function bootstrapSuperadmin() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME?.trim() || "Fluxtok Admin";

  if (!email || !password) {
    console.log("[Fluxtok] Superadmin não configurado; bootstrap de usuário ignorado.");
    return;
  }

  if (password.length < 12) throw new Error("SUPERADMIN_PASSWORD deve ter ao menos 12 caracteres.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "SUPERADMIN") console.warn("[Fluxtok] SUPERADMIN_EMAIL já pertence a outro usuário; nenhuma alteração foi feita.");
    else console.log(`[Fluxtok] Superadmin já existe: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "SUPERADMIN", active: true, companyId: null },
  });
  console.log(`[Fluxtok] Superadmin criado: ${email}`);
}

async function main() {
  await repairInterruptedPixPlanChanges();
  await bootstrapSuperadmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
