import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashToken, randomToken } from "@/lib/security";
import { SubscriptionStatus, UserRole } from "@prisma/client";

const COOKIE = "fluxtok_session";
const SESSION_DAYS = 14;

export async function createSession(userId: string) {
  const token = randomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await prisma.session.create({ data: { userId, tokenHash, expiresAt } });
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(0) });
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { company: { include: { trial: true, subscription: true, tiktokConnection: true } } } } },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active) return null;
  return session.user;
}

export function companyHasAccess(company: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>["company"]) {
  if (!company || !company.active) return false;
  const sub = company.subscription;
  if (sub) {
    if (sub.status === SubscriptionStatus.ACTIVE) return true;
    if (sub.status === SubscriptionStatus.TRIALING && sub.trialEndsAt > new Date()) return true;
    return false;
  }
  const legacyEnds = company.trial?.trialEndsAt;
  return !legacyEnds || legacyEnds > new Date();
}

export async function requireCompanyIdentity() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === UserRole.SUPERADMIN) redirect("/superadmin");
  if (!user.companyId || !user.company || !user.company.active) redirect("/account-disabled");
  return user as typeof user & { companyId: string; company: NonNullable<typeof user.company> };
}

export async function requireCompanyUser() {
  const user = await requireCompanyIdentity();
  if (!companyHasAccess(user.company)) redirect("/billing?expired=1");
  return user;
}

export async function requireCompanyAdminIdentity() {
  const user = await requireCompanyIdentity();
  if (user.role !== UserRole.COMPANY_ADMIN) redirect("/dashboard");
  return user;
}

export async function requireCompanyAdmin() {
  const user = await requireCompanyUser();
  if (user.role !== UserRole.COMPANY_ADMIN) redirect("/dashboard");
  return user;
}

export async function requireSuperadmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.SUPERADMIN) redirect("/dashboard");
  return user;
}
