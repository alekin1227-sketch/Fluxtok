import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { hashToken, randomToken } from "@/lib/security";

const API = "https://open-api.tiktokglobalshop.com";
const TOKEN_API = "https://auth.tiktok-shops.com/api/v2";

function config() {
  const appKey = process.env.TIKTOK_APP_KEY?.trim();
  const appSecret = process.env.TIKTOK_APP_SECRET?.trim();
  const serviceId = process.env.TIKTOK_SERVICE_ID?.trim();
  if (!appKey || !appSecret || !serviceId) throw new Error("TikTok Shop não configurado. Defina TIKTOK_APP_KEY, TIKTOK_APP_SECRET e TIKTOK_SERVICE_ID.");
  return { appKey, appSecret, serviceId };
}

export async function createSellerAuthorization(companyId: string, userId: string) {
  const { serviceId } = config();
  const state = randomToken();
  await prisma.tikTokOAuthState.create({
    data: { companyId, userId, stateHash: hashToken(state), expiresAt: new Date(Date.now() + 15 * 60_000) },
  });
  const market = process.env.TIKTOK_MARKET?.toUpperCase() === "US" ? "US" : "ROW";
  const base = market === "US" ? "https://services.us.tiktokshop.com/open/authorize" : "https://services.tiktokshop.com/open/authorize";
  const url = new URL(base);
  url.searchParams.set("service_id", serviceId);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function consumeOAuthState(state: string) {
  const stateHash = hashToken(state);
  const row = await prisma.tikTokOAuthState.findUnique({ where: { stateHash } });
  if (!row || row.expiresAt < new Date()) return null;
  await prisma.tikTokOAuthState.delete({ where: { id: row.id } });
  return row;
}

export async function exchangeCode(authCode: string) {
  const { appKey, appSecret } = config();
  const url = new URL(`${TOKEN_API}/token/get`);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("app_secret", appSecret);
  url.searchParams.set("auth_code", authCode);
  url.searchParams.set("grant_type", "authorized_code");
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.code !== 0 || !json.data?.access_token) throw new Error(`TikTok token: ${json.message || res.statusText}`);
  if (![0, 4, 5].includes(Number(json.data.user_type))) throw new Error("A autorização recebida não pertence a uma conta Seller do TikTok Shop.");
  return json.data as {
    access_token: string; refresh_token: string; access_token_expire_in?: number; refresh_token_expire_in?: number;
    open_id?: string; seller_name?: string; seller_base_region?: string; user_type?: number; granted_scopes?: string[];
  };
}

function sign(path: string, query: Record<string, string>, body = "") {
  const { appSecret } = config();
  const entries = Object.entries(query).filter(([k]) => k !== "sign" && k !== "access_token").sort(([a], [b]) => a.localeCompare(b));
  let message = appSecret + path;
  for (const [k, v] of entries) message += k + v;
  message += body + appSecret;
  return crypto.createHmac("sha256", appSecret).update(message).digest("hex");
}

async function apiRequest<T>(args: { path: string; token: string; query?: Record<string, string>; method?: "GET" | "POST"; body?: unknown }) {
  const { appKey } = config();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const query: Record<string, string> = { app_key: appKey, timestamp, ...(args.query || {}) };
  const body = args.body === undefined ? "" : JSON.stringify(args.body);
  query.sign = sign(args.path, query, body);
  const url = new URL(args.path, API);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: args.method || "GET",
    headers: { "content-type": "application/json", "x-tts-access-token": args.token },
    body: args.method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || json.code !== 0) throw new Error(`TikTok API: ${json.message || res.statusText}`);
  return json as T;
}

export async function getAuthorizedShops(accessToken: string) {
  const response = await apiRequest<{ data?: { shops?: Array<{ id?: string; name?: string; cipher?: string; shop_cipher?: string; region?: string }> } }>({
    path: "/authorization/202309/shops",
    token: accessToken,
  });
  return response.data?.shops || [];
}

export async function saveConnection(companyId: string, token: Awaited<ReturnType<typeof exchangeCode>>) {
  const shops = await getAuthorizedShops(token.access_token);
  const shop = shops[0];
  const toDate = (epoch?: number) => epoch ? new Date(epoch * 1000) : null;
  return prisma.tikTokConnection.upsert({
    where: { companyId },
    create: {
      companyId,
      status: "CONNECTED",
      openId: token.open_id || null,
      sellerName: token.seller_name || null,
      sellerBaseRegion: token.seller_base_region || null,
      shopId: shop?.id || null,
      shopName: shop?.name || null,
      shopCipher: shop?.cipher || shop?.shop_cipher || null,
      grantedScopes: JSON.stringify(token.granted_scopes || []),
      accessTokenEncrypted: encryptSecret(token.access_token),
      refreshTokenEncrypted: encryptSecret(token.refresh_token),
      accessTokenExpiresAt: toDate(token.access_token_expire_in),
      refreshTokenExpiresAt: toDate(token.refresh_token_expire_in),
      lastError: null,
    },
    update: {
      status: "CONNECTED",
      openId: token.open_id || null,
      sellerName: token.seller_name || null,
      sellerBaseRegion: token.seller_base_region || null,
      shopId: shop?.id || null,
      shopName: shop?.name || null,
      shopCipher: shop?.cipher || shop?.shop_cipher || null,
      grantedScopes: JSON.stringify(token.granted_scopes || []),
      accessTokenEncrypted: encryptSecret(token.access_token),
      refreshTokenEncrypted: encryptSecret(token.refresh_token),
      accessTokenExpiresAt: toDate(token.access_token_expire_in),
      refreshTokenExpiresAt: toDate(token.refresh_token_expire_in),
      lastError: null,
    },
  });
}

async function refreshConnection(connection: { id: string; refreshTokenEncrypted: string }) {
  const { appKey, appSecret } = config();
  const refreshToken = decryptSecret(connection.refreshTokenEncrypted);
  const url = new URL(`${TOKEN_API}/token/refresh`);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("app_secret", appSecret);
  url.searchParams.set("refresh_token", refreshToken);
  url.searchParams.set("grant_type", "refresh_token");
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.code !== 0 || !json.data?.access_token) throw new Error(`TikTok refresh: ${json.message || res.statusText}`);
  const d = json.data;
  await prisma.tikTokConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encryptSecret(d.access_token),
      refreshTokenEncrypted: encryptSecret(d.refresh_token || refreshToken),
      accessTokenExpiresAt: d.access_token_expire_in ? new Date(d.access_token_expire_in * 1000) : null,
      refreshTokenExpiresAt: d.refresh_token_expire_in ? new Date(d.refresh_token_expire_in * 1000) : null,
      status: "CONNECTED",
      lastError: null,
    },
  });
  return d.access_token as string;
}

export async function connectionAccessToken(companyId: string) {
  const connection = await prisma.tikTokConnection.findUnique({ where: { companyId } });
  if (!connection || connection.status === "DISCONNECTED") throw new Error("TikTok Shop não conectado.");
  if (connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() < Date.now() + 60 * 60_000) {
    return { connection, token: await refreshConnection(connection) };
  }
  return { connection, token: decryptSecret(connection.accessTokenEncrypted) };
}

export async function syncTikTokProducts(companyId: string) {
  const { connection, token } = await connectionAccessToken(companyId);
  if (!connection.shopCipher) throw new Error("A loja autorizada não retornou shop_cipher.");
  let pageToken = "";
  let synced = 0;
  do {
    const response = await apiRequest<{ data?: { products?: Array<any>; next_page_token?: string } }>({
      path: "/product/202502/products/search",
      token,
      method: "POST",
      query: { page_size: "100", shop_cipher: connection.shopCipher, ...(pageToken ? { page_token: pageToken } : {}) },
      body: { status: "ALL", locale: "pt-BR" },
    });
    const products = response.data?.products || [];
    for (const p of products) {
      const sku = p.skus?.[0]?.seller_sku || null;
      const photo = p.main_images?.[0]?.urls?.[0] || p.images?.[0]?.url || null;
      const externalId = String(p.id);
      const existing = await prisma.product.findFirst({ where: { companyId, tiktokProductId: externalId }, select: { id: true } });
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data: { name: String(p.title || `Produto ${p.id}`), sku, photoUrl: photo, tiktokSyncedAt: new Date(), active: p.status !== "DELETED" } });
      } else {
        await prisma.product.create({ data: { companyId, name: String(p.title || `Produto ${p.id}`), sku, photoUrl: photo, tiktokProductId: externalId, tiktokSyncedAt: new Date(), active: p.status !== "DELETED" } });
      }
      synced++;
    }
    pageToken = response.data?.next_page_token || "";
    if (synced >= 1000) pageToken = "";
  } while (pageToken);
  await prisma.tikTokConnection.update({ where: { id: connection.id }, data: { lastSyncAt: new Date(), lastError: null, status: "CONNECTED" } });
  return synced;
}
