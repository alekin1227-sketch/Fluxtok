import { requireCompanyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Notice } from "@/components/notice";

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyAdmin();
  const q = await searchParams;
  const members = await prisma.user.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: "asc" } });
  return <>
    <div className="page-head"><div><div className="eyebrow">EQUIPE</div><h1 className="page-title">Acessos</h1><p className="page-subtitle">Cada pessoa usa seu próprio login. Nunca compartilhe a senha do administrador.</p></div><a className="btn btn-primary" href="#novo">+ Novo acesso</a></div>
    {q.created && <Notice>Acesso criado.</Notice>}{q.saved && <Notice>Acesso atualizado.</Notice>}{q.error === "limit" && <Notice type="error">O plano Essencial permite até 3 usuários. Faça upgrade para adicionar mais pessoas.</Notice>}{q.error && q.error !== "limit" && <Notice type="error">Não foi possível criar o acesso. Confira e-mail e senha.</Notice>}
    <section className="form-card" id="novo"><div className="form-card-head"><div><h2>Novo membro</h2><p>O membro pode operar creators, amostras e conteúdos, mas não gerencia cobrança.</p></div></div><form className="stack" action="/api/team" method="post"><div className="form-grid compact-grid"><div className="field"><label>Nome *</label><input name="name" required minLength={2} /></div><div className="field"><label>E-mail *</label><input name="email" type="email" required /></div><div className="field"><label>Senha inicial *</label><input name="password" type="password" minLength={12} required placeholder="Mínimo 12 caracteres" /></div></div><div className="form-actions"><button className="btn btn-primary">Criar acesso</button></div></form></section>
    <section className="section"><div className="section-bar"><div><h2>Equipe atual</h2><p>{members.length} usuário(s)</p></div></div><div className="table-wrap"><table className="table"><thead><tr><th>Pessoa</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th></th></tr></thead><tbody>{members.map(m=><tr key={m.id}><td><strong>{m.name}</strong><div className="cell-sub">{m.email}</div></td><td>{m.role==="COMPANY_ADMIN"?"Administrador":"Membro"}</td><td><span className={`badge ${m.active?"tone-success":"tone-danger"}`}>{m.active?"Ativo":"Desativado"}</span></td><td>{m.lastLoginAt?.toLocaleString("pt-BR")||"—"}</td><td>{m.id!==user.id&&<form action={`/api/team/${m.id}/toggle`} method="post"><button className="btn btn-mini">{m.active?"Desativar":"Ativar"}</button></form>}</td></tr>)}</tbody></table></div></section>
  </>;
}
