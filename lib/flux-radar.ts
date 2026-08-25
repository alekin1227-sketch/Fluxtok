export type RadarTone = "danger" | "warning" | "success" | "info";
export type RadarItem = { title: string; detail: string; href: string; tone: RadarTone; priority: number };

type RadarSample = {
  status: string;
  trackingCode: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  contentDueAt: Date | null;
  creator: { handle: string };
  product: { name: string };
  contents: { publishedAt: Date }[];
};

export function buildFluxRadar(samples: RadarSample[], warningDays: number): RadarItem[] {
  const now = Date.now();
  const items: RadarItem[] = [];

  for (const sample of samples) {
    const pending = (sample.status === "RECEIVED" || sample.status === "WAITING_CONTENT") && sample.contents.length === 0;
    if (pending && sample.contentDueAt) {
      const diffDays = Math.ceil((sample.contentDueAt.getTime() - now) / 86400000);
      if (diffDays < 0) {
        items.push({
          title: `Cobrar ${sample.creator.handle}`,
          detail: `${sample.product.name}: conteúdo atrasado há ${Math.abs(diffDays)} dia(s).`,
          href: "/pending",
          tone: "danger",
          priority: 100 + Math.abs(diffDays),
        });
      } else if (diffDays <= warningDays) {
        items.push({
          title: `Acompanhar ${sample.creator.handle}`,
          detail: `${sample.product.name}: prazo vence em ${diffDays} dia(s).`,
          href: "/pending",
          tone: "warning",
          priority: 80 - diffDays,
        });
      }
    }

    const inTransit = sample.status === "SENT" || sample.status === "IN_TRANSIT";
    if (inTransit && !sample.trackingCode && sample.sentAt) {
      const sentDays = Math.floor((now - sample.sentAt.getTime()) / 86400000);
      if (sentDays >= 2) {
        items.push({
          title: "Adicionar rastreio",
          detail: `${sample.creator.handle} · ${sample.product.name} foi enviada há ${sentDays} dia(s) sem código de rastreio.`,
          href: "/samples",
          tone: "info",
          priority: 45 + sentDays,
        });
      }
    }
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

export function creatorFluxScore(args: {
  samples: { contentDueAt: Date | null; contents: { publishedAt: Date }[] }[];
  sales: number;
}) {
  const total = args.samples.length;
  if (total === 0) return { score: null as number | null, publicationRate: 0, onTimeRate: 0 };
  const published = args.samples.filter((s) => s.contents.length > 0);
  const publicationRate = published.length / total;
  const timed = published.filter((s) => s.contentDueAt && s.contents.some((c) => c.publishedAt <= s.contentDueAt!));
  const eligibleOnTime = published.filter((s) => s.contentDueAt).length;
  const onTimeRate = eligibleOnTime ? timed.length / eligibleOnTime : publicationRate;
  const salesSignal = Math.min(1, args.sales / 10);
  const score = Math.max(0, Math.min(100, Math.round(publicationRate * 55 + onTimeRate * 30 + salesSignal * 15)));
  return { score, publicationRate, onTimeRate };
}

export function scoreLabel(score: number | null) {
  if (score === null) return "Sem dados";
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Bom";
  if (score >= 50) return "Em observação";
  return "Baixa consistência";
}
