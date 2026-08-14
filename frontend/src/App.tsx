import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteProvider';
import AppFeedback from './components/AppFeedback';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutCallback from './pages/CheckoutCallback';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import DownloadsPage from './pages/Downloads';
import StaticPage from './pages/StaticPage';
import Contact from './pages/Contact';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminCategories from './pages/admin/Categories';
import AdminShipping from './pages/admin/Shipping';
import AdminSettings, { AdminMessages } from './pages/admin/Settings';
import AdminTheme from './pages/admin/Theme';
import AdminPages from './pages/admin/Pages';
import AdminNewsletter from './pages/admin/Newsletter';
import AdminShops from './pages/admin/Shops';
import AdminPayouts from './pages/admin/Payouts';
import AdminReferrals from './pages/admin/Referrals';
import AdminMarketing from './pages/admin/Marketing';
import AdminCoupons from './pages/admin/Coupons';
import AdminInbox from './pages/admin/Inbox';
import AdminUsers from './pages/admin/Users';
import Sell from './pages/Sell';
import ShopPage from './pages/ShopPage';
import Referrals from './pages/Referrals';
import Unsubscribe from './pages/Unsubscribe';
import AccountLayout from './pages/account/AccountLayout';
import AccountOverview from './pages/account/Overview';
import AccountProfile from './pages/account/Profile';
import AccountOrders from './pages/account/Orders';
import AccountEarnings from './pages/account/Earnings';
import VendorLayout from './pages/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorOrders from './pages/vendor/Orders';
import VendorPayouts from './pages/vendor/Payouts';
import VendorSettings from './pages/vendor/Settings';

function StaticPageRoute() {
  const { slug } = useParams();
  return <StaticPage slug={slug!} />;
}

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <AppFeedback>
        <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/callback" element={<CheckoutCallback />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/page/:slug" element={<StaticPageRoute />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/shop/:slug" element={<ShopPage />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
          </Route>

          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverview />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="earnings" element={<AccountEarnings />} />
          </Route>

          <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="payouts" element={<VendorPayouts />} />
            <Route path="settings" element={<VendorSettings />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="marketing" element={<AdminMarketing />} />
            <Route path="inbox" element={<AdminInbox />} />
            <Route path="theme" element={<AdminTheme />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
          </Route>
        </Routes>
        </BrowserRouter>
        </AppFeedback>
      </SiteProvider>
    </AuthProvider>
  );
}
