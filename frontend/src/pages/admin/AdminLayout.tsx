import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteProvider';
import { useLockBody } from '../../hooks/useLockBody';

const links = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/shipping', label: 'Shipping' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/shops', label: 'Shops' },
  { to: '/admin/payouts', label: 'Payouts' },
  { to: '/admin/referrals', label: 'Referrals' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/marketing', label: 'Marketing' },
  { to: '/admin/inbox', label: 'Inbox' },
  { to: '/admin/pages', label: 'Pages' },
  { to: '/admin/newsletter', label: 'Newsletter' },
  { to: '/admin/messages', label: 'Contact' },
  { to: '/admin/theme', label: 'Theme & layouts' },
  { to: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const { branding, logoUrl } = useSite();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useLockBody(menuOpen);

  if (loading) return <div className="admin-loading">Loading…</div>;
  if (!isAdmin) return <Navigate to="/login" />;

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const currentLabel = links.find((l) => isActive(l.to, l.exact))?.label ?? 'Admin';

  return (
    <div className={`admin-layout ${menuOpen ? 'nav-open' : ''}`}>
      <header className="admin-topbar">
        <button
          type="button"
          className="btn btn-ghost admin-menu-btn"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="admin-topbar-brand">
          <img src={logoUrl} alt={branding.site_name} className="admin-sidebar-logo" />
          <div className="admin-topbar-text">
            <p className="admin-sidebar-title">Admin</p>
            <p className="admin-topbar-page">{currentLabel}</p>
          </div>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" className="btn btn-outline admin-topbar-signout" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className="admin-sidebar">
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-top">
            <Link to="/" className="admin-back-link" onClick={() => setMenuOpen(false)}>
              ← Back to store
            </Link>
            <div className="admin-sidebar-brand">
              <img src={logoUrl} alt={branding.site_name} className="admin-sidebar-logo" />
              <div>
                <p className="admin-sidebar-title">Admin Panel</p>
                <p className="admin-sidebar-user">{user?.name}</p>
              </div>
            </div>
          </div>
          <nav className="admin-nav">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={isActive(l.to, l.exact) ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <p className="admin-sidebar-user">{user?.email}</p>
            <button type="button" className="btn btn-outline" onClick={() => logout()}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
