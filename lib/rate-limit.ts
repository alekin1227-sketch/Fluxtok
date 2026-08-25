import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function assertLoginAllowed(key: string) {
  const now = new Date();
  const row = await prisma.loginRateLimit.findUnique({ where: { key } });
  if (row?.blockedUntil && row.blockedUntil > now) throw new Error("RATE_LIMITED");
  if (row && now.getTime() - row.windowStart.getTime() > WINDOW_MS) {
    await prisma.loginRateLimit.update({ where: { key }, data: { attempts: 0, windowStart: now, blockedUntil: null } });
  }
}

export async function recordLoginFailure(key: string) {
  const now = new Date();
  const row = await prisma.loginRateLimit.upsert({
    where: { key },
    create: { key, attempts: 1, windowStart: now },
    update: { attempts: { increment: 1 } },
  });
  if (row.attempts >= MAX_ATTEMPTS) {
    await prisma.loginRateLimit.update({ where: { key }, data: { blockedUntil: new Date(now.getTime() + BLOCK_MS) } });
  }
}

export async function clearLoginFailures(key: string) {
  await prisma.loginRateLimit.deleteMany({ where: { key } });
}
