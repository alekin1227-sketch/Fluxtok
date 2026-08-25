import { requireSuperadmin } from "@/lib/auth";
import { Brand } from "@/components/brand";

const nav = [
  ["/superadmin", "Visão geral", "▦"],
  ["/superadmin/empresas", "Empresas", "▤"],
  ["/superadmin/suporte", "Suporte", "?"],
  ["/superadmin/configuracoes", "Configurações", "⚙"],
];

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperadmin();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-logo"><Brand dark /></div>
      <div className="sidebar-kicker">ADMINISTRAÇÃO</div>
      <nav className="nav">{nav.map(([href, label, icon]) => <a href={href} key={href}><span className="nav-icon">{icon}</span>{label}</a>)}</nav>
      <div className="sidebar-account"><div className="company-chip"><small>Acesso</small><strong>Superadmin</strong></div><div className="user-name">{user.name}</div><form action="/api/auth/logout" method="post"><button className="btn btn-sidebar">Sair da conta</button></form></div>
    </aside><main className="main">{children}</main>
  </div>;
}
