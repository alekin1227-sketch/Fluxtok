import { requireCompanyUser } from "@/lib/auth";
import { getCompanySettings } from "@/lib/tenant";
import { Notice } from "@/components/notice";

export default async function Settings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser(); const s=await getCompanySettings(user.companyId); const q=await searchParams; const sub=user.company.subscription;
  return <>
    <div className="page-head"><div><div className="eyebrow">PREFERÊNCIAS</div><h1 className="page-title">Configurações</h1><p className="page-subtitle">Prazos, conta, integrações e plano em um lugar simples.</p></div></div>
    {q.saved&&<Notice>Configurações salvas.</Notice>}{q.error&&<Notice type="error">Confira os valores informados.</Notice>}
    <div className="settings-grid">
      <section className="form-card"><div className="form-card-head"><div><h2>Prazos e alertas</h2><p>Usados em novas amostras e na tela de pendências.</p></div></div><form className="stack" action="/api/settings" method="post"><Field name="defaultContentDays" label="Prazo padrão para publicar" value={s.defaultContentDays} suffix="dias" min={1}/><Field name="warningDaysBeforeDue" label="Alertar antes do vencimento" value={s.warningDaysBeforeDue} suffix="dias" min={0}/><Field name="inactiveCreatorDays" label="Creator inativo após" value={s.inactiveCreatorDays} suffix="dias" min={1}/><div className="form-actions"><button className="btn btn-primary">Salvar</button></div></form></section>
      <section className="form-card"><div className="form-card-head"><div><h2>Conta</h2><p>Use pelo menos 12 caracteres na senha.</p></div></div>{q.password==="wrong"&&<Notice type="error">Senha atual incorreta.</Notice>}{q.password==="invalid"&&<Notice type="error">A nova senha é muito curta.</Notice>}<form className="stack" action="/api/account/password" method="post"><div className="field"><label>Senha atual</label><input name="currentPassword" type="password" required/></div><div className="field"><label>Nova senha</label><input name="newPassword" type="password" minLength={12} required/></div><div className="form-actions"><button className="btn btn-primary">Alterar senha</button></div></form></section>
      <section className="form-card"><div className="form-card-head"><div><h2>Plano</h2><p>Teste, assinatura e cobrança.</p></div></div><div className="info-list"><span><b>Status</b>{sub?.status||"Legado"}</span><span><b>Plano</b>{sub?.plan||"—"}</span><span><b>Teste até</b>{sub?.trialEndsAt.toLocaleDateString("pt-BR")||"—"}</span></div><a className="btn btn-soft" href="/billing">Gerenciar plano</a></section>
      <section className="form-card"><div className="form-card-head"><div><h2>Integrações e equipe</h2><p>Acesse as configurações que não precisam ficar misturadas aqui.</p></div></div><div className="feature-list compact"><a href="/integrations/tiktok"><b>TikTok Shop →</b><span>Conectar loja e sincronizar produtos</span></a><a href="/team"><b>Equipe →</b><span>Gerenciar acessos individuais</span></a></div></section>
    </div>
  </>;
}
function Field({name,label,value,suffix,min}:{name:string;label:string;value:number;suffix:string;min:number}){return <div className="field"><label>{label}</label><div className="input-suffix"><input name={name} type="number" min={min} max="365" defaultValue={value} required/><span>{suffix}</span></div></div>}
