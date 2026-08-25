import { requireSuperadmin } from "@/lib/auth";
import { Brand } from "@/components/brand";

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperadmin();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-logo"><Brand dark /></div>
      <div className="sidebar-kicker">ADMINISTRAÇÃO</div>
      <nav className="nav"><a href="/superadmin"><span className="nav-icon">▦</span>Empresas</a></nav>
      <div className="sidebar-account"><div className="company-chip"><small>Acesso</small><strong>Superadmin</strong></div><div className="user-name">{user.name}</div><form action="/api/auth/logout" method="post"><button className="btn btn-sidebar">Sair da conta</button></form></div>
    </aside><main className="main">{children}</main>
  </div>;
}
