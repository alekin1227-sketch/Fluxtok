import nodemailer from "nodemailer";

function transporterOrNull() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

async function sendMail(args: { to: string; subject: string; text: string; replyTo?: string | null }) {
  const transporter = transporterOrNull();
  if (!transporter) {
    if (process.env.NODE_ENV !== "production") console.log(`[Fluxtok DEV] E-mail para ${args.to}: ${args.subject}`);
    return false;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: args.to,
    subject: args.subject,
    text: args.text,
    replyTo: args.replyTo || undefined,
  });
  return true;
}

export async function sendPasswordReset(email: string, resetUrl: string) {
  return sendMail({
    to: email,
    subject: "Redefinição de senha — Fluxtok",
    text: `Use este link para redefinir sua senha: ${resetUrl}\n\nO link expira em 30 minutos.`,
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
