import { redirect } from "next/navigation";
import { requireCompanyIdentity } from "@/lib/auth";
import { Brand } from "@/components/brand";

export default async function Onboarding() {
  const user = await requireCompanyIdentity();
  if (user.company.onboardingCompleted) redirect("/dashboard");
  return <main className="onboarding-shell">
    <div className="onboarding-card stack">
      <Brand />
      <div className="step-pill">Configuração inicial · cerca de 1 minuto</div>
      <div><h1 className="page-title">Você não precisa configurar tudo agora.</h1><p className="page-subtitle">Comece com o fluxo básico. O FluxRadar passa a sugerir as próximas ações conforme sua operação ganha dados.</p></div>
      <div className="onboarding-grid">
        <article><strong>1. Creator</strong><span>Cadastre nome e @. Os detalhes ficam opcionais.</span></article>
        <article><strong>2. Produto + amostra</strong><span>Registre o envio e acompanhe recebimento e prazo.</span></article>
        <article><strong>3. FluxRadar</strong><span>O painel prioriza atrasos, prazos próximos e envios sem rastreio.</span></article>
      </div>
      <div className="tip-card"><strong>TikTok Shop é opcional no início</strong><p>Você pode operar manualmente e conectar a API oficial depois, quando tiver as credenciais do Partner Center.</p></div>
      <form action="/api/onboarding/complete" method="post"><button className="btn btn-primary btn-lg">Entrar no Fluxtok</button></form>
      <small className="muted">Seu teste padrão é de 7 dias, sem cartão. O Superadmin pode estender o período quando necessário.</small>
    </div>
  </main>;
}
