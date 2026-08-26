import { NextRequest } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";

export function assertSameOrigin(req: NextRequest) {
  const allowed = new URL(getAppBaseUrl()).origin;
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const fetchSite = req.headers.get("sec-fetch-site");

  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    throw new Error("INVALID_FETCH_SITE");
  }

  if (origin) {
    if (origin !== allowed) throw new Error("INVALID_ORIGIN");
    return;
  }

  if (referer) {
    try {
      if (new URL(referer).origin !== allowed) throw new Error("INVALID_REFERER");
      return;
    } catch {
      throw new Error("INVALID_REFERER");
    }
  }

  // Navegadores modernos normalmente enviam Origin ou Referer em POSTs de formulário.
  // Em produção, a ausência dos dois é tratada como inválida para reduzir CSRF.
  if (process.env.NODE_ENV === "production") throw new Error("MISSING_ORIGIN");
}
