import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, User, Download, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteProvider';
import CategoryMenu from './CategoryMenu';
import { useLockBody } from '../hooks/useLockBody';

export default function Header() {
  const { user, logout, isAdmin, loading } = useAuth();
  const { branding, logoUrl } = useSite();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  useLockBody(menuOpen);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header ${menuOpen ? 'nav-open' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="brand-link" onClick={closeMenu}>
          <img src={logoUrl} alt={branding.site_name} className="brand-logo" />
          <span className="brand-name">{branding.site_name}</span>
        </Link>

        <nav className={`header-nav ${menuOpen ? 'is-open' : ''}`}>
          <CategoryMenu onNavigate={closeMenu} />
          <Link to="/browse" className="btn btn-ghost nav-link" onClick={closeMenu}>Browse</Link>
          <Link to="/page/how-it-works" className="btn btn-ghost nav-link" onClick={closeMenu}>Guide</Link>
          <Link to="/contact" className="btn btn-ghost nav-link" onClick={closeMenu}>Contact</Link>
          {user?.shop?.status === 'approved' ? (
            <Link to="/vendor" className="btn btn-ghost nav-link" onClick={closeMenu}>Vendor</Link>
          ) : (
            <Link to="/sell" className="btn btn-ghost nav-link" onClick={closeMenu}>Sell</Link>
          )}

          <div className="header-nav-account">
            {user ? (
              <>
                <Link to="/downloads" className="btn btn-ghost" onClick={closeMenu}>
                  <Download size={18} /> Downloads
                </Link>
                <Link to="/cart" className="btn btn-ghost" onClick={closeMenu}>
                  <ShoppingBag size={18} /> Cart
                </Link>
                <Link to="/account" className="btn btn-ghost" onClick={closeMenu}>Account</Link>
                {isAdmin && <Link to="/admin" className="btn btn-outline" onClick={closeMenu}>Admin</Link>}
                <button type="button" className="btn btn-outline" onClick={() => { closeMenu(); logout(); }}>
                  Sign out
                </button>
              </>
            ) : !loading ? (
              <>
                <Link to="/cart" className="btn btn-ghost" onClick={closeMenu}>
                  <ShoppingBag size={18} /> Cart
                </Link>
                <Link to="/login" className="btn btn-ghost" onClick={closeMenu}>
                  <User size={16} /> Sign in
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>Sign up</Link>
              </>
            ) : null}
          </div>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link to="/downloads" className="btn btn-ghost header-icon-link header-desktop-only" aria-label="Downloads">
                <Download size={18} />
                <span>Downloads</span>
              </Link>
              <Link to="/cart" className="btn btn-ghost header-icon-link" aria-label="Cart">
                <ShoppingBag size={18} />
                <span className="header-desktop-only">Cart</span>
              </Link>
              {isAdmin && <Link to="/admin" className="btn btn-outline header-desktop-only header-admin-link">Admin</Link>}
              <Link to="/account" className="btn btn-ghost header-desktop-only">Account</Link>
              <button type="button" className="btn btn-ghost header-desktop-only" onClick={() => logout()}>Sign out</button>
            </>
          ) : !loading ? (
            <>
              <Link to="/cart" className="btn btn-ghost header-icon-link" aria-label="Cart">
                <ShoppingBag size={18} />
                <span className="header-desktop-only">Cart</span>
              </Link>
              <Link to="/login" className="btn btn-ghost header-desktop-only"><User size={16} /> Sign in</Link>
              <Link to="/register" className="btn btn-primary header-desktop-only">Sign up</Link>
            </>
          ) : null}

          <button
            type="button"
            className="btn btn-ghost header-menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <button type="button" className="header-nav-backdrop" aria-label="Close menu" onClick={closeMenu} />
      )}
    </header>
  );
}
