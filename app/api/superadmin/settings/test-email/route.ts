import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { getPlatformSettings } from "@/lib/platform-settings";
import { sendPlatformNotification } from "@/lib/mail";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  await requireSuperadmin();
  const settings = await getPlatformSettings();
  if (!settings.notificationEmail) return NextResponse.redirect(appUrl("/superadmin/configuracoes?error=no-email"), 303);

  try {
    const sent = await sendPlatformNotification({
      to: settings.notificationEmail,
      subject: "[Fluxtok] Teste de notificações",
      text: "Seu SMTP e o e-mail de notificações do Fluxtok estão funcionando. Esta mensagem foi enviada pelo teste do Superadmin.",
    });
    return NextResponse.redirect(appUrl(sent ? "/superadmin/configuracoes?email-test=ok" : "/superadmin/configuracoes?email-test=missing-smtp"), 303);
  } catch (error) {
    console.error("test support email", error);
    return NextResponse.redirect(appUrl("/superadmin/configuracoes?email-test=error"), 303);
  }
}
