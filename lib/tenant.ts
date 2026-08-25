import { prisma } from "@/lib/prisma";

export async function getCompanySettings(companyId: string) {
  return prisma.setting.upsert({
    where: { companyId },
    update: {},
    create: { companyId },
  });
}

export function parseDate(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysSince(date?: Date | null) {
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export function pendingTone(dueAt: Date | null, warningDays: number) {
  if (!dueAt) return "neutral";
  const days = Math.ceil((dueAt.getTime() - Date.now()) / 86400000);
  if (days < 0) return "danger";
  if (days <= warningDays) return "warning";
  return "success";
}
