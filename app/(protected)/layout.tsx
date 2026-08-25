import { requireCompanyUser } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { UserRole } from "@prisma/client";

const nav = [
  ["/dashboard", "Visão geral", "◫"],
  ["/creators", "Creators", "@"],
  ["/campaigns", "Campanhas", "◎"],
  ["/samples", "Amostras", "□"],
  ["/contents", "Conteúdos", "▶"],
  ["/pending", "Pendências", "!"],
  ["/products", "Produtos", "◇"],
  ["/integrations/tiktok", "TikTok Shop", "♪"],
  ["/team", "Equipe", "＋"],
  ["/settings", "Configurações", "⚙"],
];

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCompanyUser();
  const sub = user.company.subscription;
  const daysLeft = sub?.status === "TRIALING" ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000)) : null;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-logo"><Brand dark /></div>
      <div className="sidebar-kicker">CREATOR COMMERCE OPS</div>
      <nav className="nav">{nav.filter(([href]) => href !== "/team" || user.role === UserRole.COMPANY_ADMIN).map(([href,label,icon])=><a href={href} key={href}><span className="nav-icon">{icon}</span>{label}</a>)}</nav>
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
