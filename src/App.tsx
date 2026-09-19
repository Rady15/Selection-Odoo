import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { UIProvider, useUI } from './context/UIContext';

// Components
import Header from './components/storefront/Header';
import Footer from './components/storefront/Footer';
import SearchOverlay from './components/storefront/SearchOverlay';
import CartDrawer from './components/storefront/CartDrawer';
import AuthModal from './components/storefront/AuthModal';
import CoffeeFinderFloat from './components/storefront/CoffeeFinderFloat';
import BrandLoader from './components/common/BrandLoader';

// Pages
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CoffeeFinderPage from './pages/CoffeeFinderPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import CustomerAccountPage from './pages/CustomerAccountPage';
import {
 AboutPage,
 WholesalePage,
 ContactPage,
 TermsPage,
 PrivacyPage,
 ShippingPolicyPage,
 FaqPage,
 BrewingGuidePage,
 SubscriptionsPage,
 LocationsPage,
 TrackOrderPage,
 BlogPage,
 GiftCardsPage
} from './pages/StaticPages';
import AdminPage from './pages/AdminPage';

function MainApp() {
  const { language } = useLanguage();
  const { authOpen, authMessage, openAuth, closeAuth, fireAuthSuccess } = useUI();
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global brand splash: covers first paint + server data warm-up, then fades.
  const [bootVisible, setBootVisible] = useState(true);
  const [bootMounted, setBootMounted] = useState(true);
  useEffect(() => {
    const start = Date.now();
    let timers: number[] = [];
    const finish = () => {
      const wait = Math.max(0, 900 - (Date.now() - start));
      timers.push(window.setTimeout(() => {
        setBootVisible(false);
        timers.push(window.setTimeout(() => setBootMounted(false), 450));
      }, wait));
    };
    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
      timers.push(window.setTimeout(finish, 4000));
    }
    return () => {
      window.removeEventListener('load', finish);
      timers.forEach(t => window.clearTimeout(t));
    };
  }, []);

  // Sync browser history with internal state
  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPath]);

  const navigate = (path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const pathname = currentPath.split('?')[0];
  const searchParams = new URLSearchParams(currentPath.includes('?') ? currentPath.split('?')[1] : '');
  const isAdminRoute = pathname.startsWith('/admin');

  const renderContent = () => {
    if (pathname === '/') {
      return <HomePage onNavigate={navigate} />;
    }

    if (pathname === '/products') {
      return (
        <ProductListingPage
          onNavigate={navigate}
          initialCategory={searchParams.get('category') || ''}
          initialSearch={searchParams.get('search') || ''}
        />
      );
    }

    if (pathname.startsWith('/category/')) {
      const catSlug = pathname.replace('/category/', '');
      return <ProductListingPage onNavigate={navigate} initialCategory={catSlug} />;
    }

    if (pathname === '/categories') {
      return <ProductListingPage onNavigate={navigate} />;
    }

    if (pathname.startsWith('/products/')) {
      const slug = pathname.replace('/products/', '');
      return <ProductDetailPage slug={slug} onNavigate={navigate} />;
    }

    if (pathname === '/coffee-finder') {
      return <CoffeeFinderPage onNavigate={navigate} />;
    }

    if (pathname === '/cart') {
      return <CartPage onNavigate={navigate} />;
    }

    if (pathname === '/checkout') {
      return <CheckoutPage onNavigate={navigate} />;
    }

    if (pathname.startsWith('/order-confirmation/')) {
      const orderId = pathname.replace('/order-confirmation/', '');
      return <OrderConfirmationPage orderId={orderId} onNavigate={navigate} />;
    }

    if (pathname === '/account') {
      return <CustomerAccountPage onNavigate={navigate} />;
    }

    if (pathname === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    if (pathname === '/wholesale') {
      return <WholesalePage onNavigate={navigate} />;
    }

    if (pathname === '/contact') {
      return <ContactPage onNavigate={navigate} />;
    }

    if (pathname === '/terms') {
      return <TermsPage onNavigate={navigate} />;
    }

    if (pathname === '/privacy') {
      return <PrivacyPage onNavigate={navigate} />;
    }

    if (pathname === '/shipping-policy') {
      return <ShippingPolicyPage onNavigate={navigate} />;
    }

    if (pathname === '/faq') {
      return <FaqPage onNavigate={navigate} />;
    }

    if (pathname === '/brewing-guide') {
      return <BrewingGuidePage onNavigate={navigate} />;
    }

    if (pathname === '/subscriptions') {
      return <SubscriptionsPage onNavigate={navigate} />;
    }

    if (pathname === '/locations') {
      return <LocationsPage onNavigate={navigate} />;
    }

    if (pathname === '/track-order') {
      return <TrackOrderPage onNavigate={navigate} />;
    }

    if (pathname.startsWith('/track-order/')) {
      const orderNumber = decodeURIComponent(pathname.replace('/track-order/', ''));
      return <TrackOrderPage orderNumber={orderNumber} onNavigate={navigate} />;
    }

    if (pathname === '/blog') {
      return <BlogPage onNavigate={navigate} />;
    }

    if (pathname === '/gift-cards') {
      return <GiftCardsPage onNavigate={navigate} />;
    }

    if (isAdminRoute) {
      return <AdminPage onNavigate={navigate} />;
    }

    // 404 Fallback
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl font-extrabold text-[#6CC6C9] font-serif mb-4">404</div>
        <h1 className="text-2xl font-bold text-[#1A2E30] mb-2">{language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}</h1>
        <p className="text-[#6B8C8E] mb-6 max-w-md">{language === 'ar' ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.' : 'Sorry, the page you are looking for does not exist or has been moved.'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#0E5257] hover:bg-[#2B7D82] text-white px-6 py-3 rounded-xl font-bold transition cursor-pointer"
        >
          {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </button>
      </div>
    );
  };

  return (
    <div className={`min-h-screen brand-mesh ${language === 'ar' ? 'font-sans' : 'font-sans'}`}>
      
      {/* Show Navigation Header if not in Admin */}
      {!isAdminRoute && (
        <Header
          currentPath={pathname}
          onNavigate={navigate}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAuth={() => openAuth()}
        />
      )}

      {/* Main Dynamic View */}
      <main className="min-h-screen">
        {renderContent()}
      </main>

      {/* Show Storefront Footer if not in Admin */}
      {!isAdminRoute && (
        <Footer onNavigate={navigate} />
      )}

      {/* Modals & Overlays */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
      />

      <CartDrawer
        onNavigate={navigate}
      />

      {/* Floating coffee-finder button (storefront only, hidden on its own page) */}
      {!isAdminRoute && pathname !== '/coffee-finder' && (
        <CoffeeFinderFloat onNavigate={navigate} />
      )}

      <AuthModal
        isOpen={authOpen}
        message={authMessage}
        onClose={closeAuth}
        onSuccess={fireAuthSuccess}
        onNavigate={navigate}
      />

      {/* Global brand preloader */}
      {bootMounted && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] transition-opacity duration-500 ${bootVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <BrandLoader size={96} />
        </div>
      )}

    </div>
  );
}

const GoogleAuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { language } = useLanguage();
 const googleClientId =
 import.meta.env.VITE_GOOGLE_CLIENT_ID ||
 import.meta.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
 '';
 if (!googleClientId) {
 return <>{children}</>;
 }
 return (
 <GoogleOAuthProvider clientId={googleClientId} locale={language === 'ar' ? 'ar' : 'en'}>
 {children}
 </GoogleOAuthProvider>
 );
};

export default function App() {
 return (
 <LanguageProvider>
 <GoogleAuthShell>
 <CurrencyProvider>
 <AuthProvider>
 <CartProvider>
 <WishlistProvider>
 <UIProvider>
 <MainApp />
 </UIProvider>
 </WishlistProvider>
 </CartProvider>
 </AuthProvider>
 </CurrencyProvider>
 </GoogleAuthShell>
 </LanguageProvider>
 );
}
