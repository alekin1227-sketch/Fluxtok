import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME?.trim() || "Fluxtok Admin";

  if (!email || !password) {
    console.log("[Fluxtok] Superadmin não configurado; bootstrap ignorado.");
    return;
  }

  if (password.length < 12) {
    throw new Error("SUPERADMIN_PASSWORD deve ter ao menos 12 caracteres.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "SUPERADMIN") {
      console.warn("[Fluxtok] SUPERADMIN_EMAIL já pertence a outro usuário; nenhuma alteração foi feita.");
    } else {
      console.log(`[Fluxtok] Superadmin já existe: ${email}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "SUPERADMIN",
      active: true,
      companyId: null,
    },
  });

  console.log(`[Fluxtok] Superadmin criado: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
