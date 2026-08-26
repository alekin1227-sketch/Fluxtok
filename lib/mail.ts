import nodemailer from "nodemailer";

function transporterOrNull() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    requireTLS: !secure,
    tls: { minVersion: "TLSv1.2" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailShell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:0 auto;padding:32px 18px"><div style="background:#071426;border-radius:18px 18px 0 0;padding:22px 26px;color:#fff"><div style="font-size:25px;font-weight:800">Fluxtok</div></div><div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 18px 18px;padding:28px"><h1 style="font-size:24px;margin:0 0 16px">${escapeHtml(title)}</h1>${body}<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#64748b">Se você não solicitou esta ação, ignore este e-mail. Nunca envie sua senha, código ou credenciais do Fluxtok por e-mail.</p></div></div></body></html>`;
}

async function sendMail(args: { to: string; subject: string; text: string; html?: string; replyTo?: string | null }) {
  const transporter = transporterOrNull();
  if (!transporter) {
    if (process.env.NODE_ENV !== "production") console.log(`[Fluxtok DEV] E-mail não enviado: ${args.subject}`);
    return false;
  }

  const from = process.env.SMTP_FROM?.trim() || `Fluxtok <${process.env.SMTP_USER}>`;
  await transporter.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    text: args.text,
    html: args.html,
    replyTo: args.replyTo || undefined,
  });
  return true;
}

export async function sendPasswordReset(email: string, resetUrl: string) {
  const safeUrl = escapeHtml(resetUrl);
  return sendMail({
    to: email,
    subject: "Redefina sua senha — Fluxtok",
    text: `Recebemos uma solicitação para redefinir sua senha do Fluxtok.\n\nAbra este link: ${resetUrl}\n\nO link expira em 30 minutos e só pode ser usado uma vez.\n\nSe você não pediu isso, ignore esta mensagem.`,
    html: emailShell(
      "Redefina sua senha",
      `<p style="font-size:15px;line-height:1.7;color:#475569">Recebemos uma solicitação para redefinir a senha da sua conta Fluxtok.</p><p style="margin:24px 0"><a href="${safeUrl}" style="display:inline-block;background:#1677ff;color:white;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">Redefinir minha senha</a></p><p style="font-size:13px;line-height:1.6;color:#64748b">Este link expira em <b>30 minutos</b> e só pode ser usado uma vez.</p>`,
    ),
  });
}

export async function sendPasswordChanged(email: string) {
  return sendMail({
    to: email,
    subject: "Sua senha foi alterada — Fluxtok",
    text: "A senha da sua conta Fluxtok foi alterada com sucesso. Todas as sessões anteriores foram encerradas. Se não foi você, entre em contato com o suporte imediatamente.",
    html: emailShell(
      "Senha alterada com sucesso",
      `<p style="font-size:15px;line-height:1.7;color:#475569">A senha da sua conta foi alterada. Por segurança, todas as sessões anteriores foram encerradas.</p><p style="font-size:13px;line-height:1.6;color:#64748b">Se você não realizou esta alteração, contate o suporte imediatamente e proteja também o e-mail associado à sua conta.</p>`,
    ),
  });
}

export async function sendSupportNotification(args: { to: string; company: string; subject: string; ticketUrl: string; customerEmail: string; message: string }) {
  return sendMail({
    to: args.to,
    subject: `[Fluxtok Suporte] ${args.company}: ${args.subject}`,
    replyTo: args.customerEmail,
    text: `Novo chamado de ${args.company}.\n\nAssunto: ${args.subject}\nCliente: ${args.customerEmail}\n\n${args.message}\n\nResponder no Superadmin: ${args.ticketUrl}`,
  });
}

export async function sendSupportReply(args: { to: string; supportName: string; subject: string; ticketUrl: string; message: string; replyTo?: string | null }) {
  return sendMail({
    to: args.to,
    subject: `Resposta do suporte Fluxtok — ${args.subject}`,
    replyTo: args.replyTo,
    text: `${args.supportName} respondeu seu chamado:\n\n${args.message}\n\nAcesse a conversa: ${args.ticketUrl}`,
  });
}

export async function sendPlatformNotification(args: { to: string; subject: string; text: string }) {
  return sendMail({ to: args.to, subject: args.subject, text: args.text });
}
