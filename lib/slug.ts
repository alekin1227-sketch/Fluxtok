import { prisma } from "@/lib/prisma";

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "empresa";
}

export async function uniqueCompanySlug(name: string) {
  const base = slugify(name);
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const found = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (!found) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}
