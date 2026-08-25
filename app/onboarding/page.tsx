import { redirect } from "next/navigation";
import { requireCompanyIdentity } from "@/lib/auth";
import { Brand } from "@/components/brand";

export default async function Onboarding() {
  const user = await requireCompanyIdentity();
  if (user.company.onboardingCompleted) redirect("/dashboard");
  return <main className="onboarding-shell">
    <div className="onboarding-card stack">
      <Brand />
      <div className="step-pill">Configuração inicial · 1 minuto</div>
      <div><h1 className="page-title">Sua operação está pronta.</h1><p className="page-subtitle">Você pode começar manualmente agora e conectar o TikTok Shop quando tiver as credenciais do Partner Center.</p></div>
      <div className="onboarding-grid">
        <article><strong>1. Creators</strong><span>Cadastre só nome e @. Complete detalhes quando precisar.</span></article>
        <article><strong>2. Amostras</strong><span>Vincule creator + produto e acompanhe prazo de publicação.</span></article>
        <article><strong>3. TikTok Shop</strong><span>Sincronize produtos automaticamente pela API oficial.</span></article>
      </div>
      <form action="/api/onboarding/complete" method="post"><button className="btn btn-primary btn-lg">Entrar no Fluxtok</button></form>
      <small className="muted">Seu teste termina em 7 dias. Seus dados não são apagados ao final do período.</small>
    </div>
  </main>;
}
