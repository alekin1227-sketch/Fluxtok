import { prisma } from "@/lib/prisma";

const DISPLAY_API = "https://open.tiktokapis.com";

export function tiktokDisplayConfigured() {
  return Boolean(process.env.TIKTOK_DISPLAY_ACCESS_TOKEN?.trim());
}

export function extractTikTokVideoId(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(/\/video\/(\d{8,30})/i);
  return match?.[1] || null;
}

type TikTokVideo = {
  id: string;
  title?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  share_url?: string;
};

async function queryVideos(videoIds: string[]) {
  const token = process.env.TIKTOK_DISPLAY_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("TikTok Display API não configurada.");
  const params = new URLSearchParams({ fields: "id,title,view_count,like_count,comment_count,share_count,share_url" });
  const res = await fetch(`${DISPLAY_API}/v2/video/query/?${params.toString()}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ filters: { video_ids: videoIds } }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || (json.error?.code && json.error.code !== "ok")) {
    throw new Error(json.error?.message || json.message || `TikTok Display API HTTP ${res.status}`);
  }
  return (json.data?.videos || []) as TikTokVideo[];
}

export async function syncTikTokContentViews(companyId: string) {
  const contents = await prisma.content.findMany({
    where: { companyId, url: { contains: "tiktok.com" } },
    select: { id: true, url: true, tiktokContentId: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  const byVideoId = new Map<string, Array<{ id: string; storedId: string | null }>>();
  for (const content of contents) {
    const videoId = content.tiktokContentId || extractTikTokVideoId(content.url);
    if (!videoId) continue;
    const rows = byVideoId.get(videoId) || [];
    rows.push({ id: content.id, storedId: content.tiktokContentId });
    byVideoId.set(videoId, rows);
  }

  const ids = Array.from(byVideoId.keys());
  let updated = 0;
  let returned = 0;
  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    const videos = await queryVideos(batch);
    returned += videos.length;
    for (const video of videos) {
      const rows = byVideoId.get(String(video.id)) || [];
      for (const row of rows) {
        await prisma.content.update({
          where: { id: row.id },
          data: {
            tiktokContentId: row.storedId || String(video.id),
            views: Number.isFinite(Number(video.view_count)) ? Math.max(0, Math.trunc(Number(video.view_count))) : undefined,
          },
        });
        updated++;
      }
    }
  }

  return { candidates: ids.length, returned, updated, skipped: Math.max(0, ids.length - returned) };
}
