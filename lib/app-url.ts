export function getAppBaseUrl() {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const renderHost = process.env.RENDER_EXTERNAL_HOSTNAME?.trim();
  if (renderHost) return `https://${renderHost}`;

  return "http://localhost:3000";
}

export function appUrl(path: string) {
  return new URL(path, getAppBaseUrl());
}
