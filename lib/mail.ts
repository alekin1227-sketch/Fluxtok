import nodemailer from "nodemailer";

export async function sendPasswordReset(email: string, resetUrl: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[Fluxtok] SMTP não configurado; e-mail de recuperação não enviado.");
      return false;
    }

    console.log(`[Fluxtok DEV] Reset de senha para ${email}: ${resetUrl}`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to: email,
    subject: "Redefinição de senha — Fluxtok",
    text: `Use este link para redefinir sua senha: ${resetUrl}\n\nO link expira em 30 minutos.`,
  });

  return true;
}
