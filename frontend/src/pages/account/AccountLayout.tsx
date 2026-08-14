import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLockBody } from '../../hooks/useLockBody';

const links = [
  { to: '/account', label: 'Overview', exact: true },
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/earnings', label: 'Earnings' },
];

export default function AccountLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useLockBody(menuOpen);

  if (loading) return <div className="admin-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" />;

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);
  const currentLabel = links.find((l) => isActive(l.to, l.exact))?.label ?? 'Account';

  return (
    <div className={`admin-layout ${menuOpen ? 'nav-open' : ''}`}>
      <header className="admin-topbar">
        <button type="button" className="btn btn-ghost admin-menu-btn" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="admin-topbar-brand">
          <img src="/logo.png" alt="The Tailors Market" className="admin-sidebar-logo" />
          <div className="admin-topbar-text">
            <p className="admin-sidebar-title">Account</p>
            <p className="admin-topbar-page">{currentLabel}</p>
          </div>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" className="btn btn-outline admin-topbar-signout" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </header>
      {menuOpen && <button type="button" className="admin-nav-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-top">
            <Link to="/" className="admin-back-link" onClick={() => setMenuOpen(false)}>← Back to store</Link>
            <div className="admin-sidebar-brand">
              <img src="/logo.png" alt="The Tailors Market" className="admin-sidebar-logo" />
              <div>
                <p className="admin-sidebar-title">{user.name}</p>
                <p className="admin-sidebar-user">{user.email}</p>
              </div>
            </div>
          </div>
          <nav className="admin-nav">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={isActive(l.to, l.exact) ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user.shop?.status === 'approved' && (
              <Link to="/vendor" onClick={() => setMenuOpen(false)}>Vendor dashboard</Link>
            )}
            {user.shop?.status !== 'approved' && (
              <Link to="/sell" onClick={() => setMenuOpen(false)}>Become a vendor</Link>
            )}
          </nav>
          <div className="admin-sidebar-footer">
            <button type="button" className="btn btn-outline" onClick={() => logout()}>Sign out</button>
          </div>
        </div>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
