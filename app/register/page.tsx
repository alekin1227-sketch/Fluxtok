import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const current = await getCurrentUser();
  if (current) redirect(current.role === "SUPERADMIN" ? "/superadmin" : "/dashboard");
  const q = await searchParams;
  return <main className="auth-shell auth-shell-brand">
    <section className="auth-card stack auth-card-wide">
      <Brand />
      <div><div className="eyebrow">7 DIAS GRÁTIS</div><h1 className="auth-title">Crie sua conta</h1><p className="muted">Comece sem cartão. Sua loja recebe um espaço separado e seguro no Fluxtok.</p></div>
      {q.error === "duplicate" && <div className="notice notice-error">Este e-mail já possui uma conta.</div>}
      {q.error === "invalid" && <div className="notice notice-error">Confira os dados. A senha deve ter pelo menos 12 caracteres.</div>}
      {q.error === "server" && <div className="notice notice-error">Não foi possível criar sua conta agora. Tente novamente.</div>}
      <form className="stack" action="/api/auth/register" method="post">
        <div className="form-grid compact-grid">
          <div className="field"><label>Seu nome *</label><input name="name" placeholder="Ex.: Mariana Costa" required minLength={2} /></div>
          <div className="field"><label>Nome da loja *</label><input name="companyName" placeholder="Ex.: Loja Aurora" required minLength={2} /></div>
          <div className="field"><label>E-mail *</label><input name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required /></div>
          <div className="field"><label>Senha *</label><input name="password" type="password" autoComplete="new-password" minLength={12} placeholder="Mínimo 12 caracteres" required /></div>
        </div>
        <label className="check-row"><input type="checkbox" name="terms" value="yes" required /><span>Concordo com os <a href="/termos" target="_blank">Termos de uso</a> e a <a href="/privacidade" target="_blank">Política de privacidade</a>.</span></label>
        <button className="btn btn-primary btn-lg" type="submit">Começar meus 7 dias grátis</button>
      </form>
      <div className="auth-foot">Já possui uma conta? <a className="text-link" href="/login">Entrar</a></div>
    </section>
  </main>;
}
