import { Link } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';
import { useSite } from '../context/SiteProvider';

export default function Footer() {
  const { branding, logoUrl } = useSite();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          <div>
            <img src={logoUrl} alt={branding.site_name} className="site-footer-logo" />
            <p className="muted-line">
              Everything tailors need — fabrics, tools, patterns, and supplies.
            </p>
          </div>
          <div>
            <h4 className="site-footer-heading">Marketplace</h4>
            <div className="site-footer-links">
              <Link to="/browse">Browse products</Link>
              <Link to="/browse?new_arrivals=1">New arrivals</Link>
              <Link to="/sell">Sell on the market</Link>
            </div>
          </div>
          <div>
            <h4 className="site-footer-heading">Support</h4>
            <div className="site-footer-links">
              <Link to="/page/how-it-works">How it works</Link>
              <Link to="/contact">Contact us</Link>
              <Link to="/page/licensing">Licensing</Link>
            </div>
          </div>
          <div>
            <h4 className="site-footer-heading">Newsletter</h4>
            <p className="muted-line" style={{ marginBottom: 12 }}>
              New supplies and offers in your inbox.
            </p>
            <NewsletterSignup compact />
            <p className="help-text">
              <Link to="/unsubscribe">Unsubscribe</Link>
            </p>
          </div>
        </div>
        <p className="site-footer-copy">
          © {new Date().getFullYear()} {branding.site_name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
