import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SeasonAtmosphere from './SeasonAtmosphere';
import { useSite } from '../context/SiteProvider';

export default function Layout() {
  const { layout } = useSite();

  return (
    <div className={`site-shell layout-${layout.id}`} data-layout-shell={layout.id} data-layout-bg={layout.bg_mode}>
      <SeasonAtmosphere />
      <Header />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
