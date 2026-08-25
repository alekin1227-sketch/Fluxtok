import { requireCompanyIdentity } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { UserRole } from "@prisma/client";

const primaryNav = [
  ["/dashboard", "Início", "◫"],
  ["/creators", "Creators", "@"],
  ["/samples", "Amostras", "□"],
  ["/pending", "Pendências", "!"],
  ["/contents", "Conteúdos", "▶"],
];

const secondaryNav = [
  ["/products", "Produtos", "◇"],
  ["/campaigns", "Campanhas", "◎"],
  ["/integrations/tiktok", "TikTok", "♪"],
  ["/team", "Equipe", "＋"],
  ["/support", "Suporte", "?"],
  ["/settings", "Configurações", "⚙"],
];

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCompanyIdentity();
  const sub = user.company.subscription;
  const daysLeft = sub?.status === "TRIALING" ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000)) : null;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-logo"><Brand dark /></div>
      <div className="sidebar-kicker">OPERAÇÃO COM CREATORS</div>
      <nav className="nav nav-primary">{primaryNav.map(([href,label,icon])=><a href={href} key={href}><span className="nav-icon">{icon}</span>{label}</a>)}</nav>
      <details className="sidebar-more">
        <summary>Cadastros e ajustes</summary>
        <nav className="nav nav-secondary">{secondaryNav.filter(([href]) => href !== "/team" || user.role === UserRole.COMPANY_ADMIN).map(([href,label,icon])=><a href={href} key={href}><span className="nav-icon">{icon}</span>{label}</a>)}</nav>
      </details>
      <div className="sidebar-account">
        {daysLeft !== null && <a className="trial-chip" href="/billing"><b>{daysLeft} dia(s)</b><span>restantes no teste</span></a>}
        <div className="company-chip"><small>Empresa</small><strong>{user.company.name}</strong></div>
        <div className="user-name">{user.name}</div>
        <div className="sidebar-links"><a href="/billing">Plano</a></div>
        <form action="/api/auth/logout" method="post"><button className="btn btn-sidebar" type="submit">Sair da conta</button></form>
      </div>
    </aside>
    <main className="main">{children}</main>
  </div>;
}
