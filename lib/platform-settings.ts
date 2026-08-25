import { prisma } from "@/lib/prisma";

export async function getPlatformSettings() {
  return prisma.platformSetting.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", supportName: "Equipe Fluxtok" },
  });
}
