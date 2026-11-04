import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency, currencies } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { Currency, AnnouncementBarConfig } from '../../types';
import MegaMenu from './MegaMenu';
import MobileMenuDrawer from './MobileMenuDrawer';
import {
 Search,
 ShoppingBag,
 Heart,
 User,
 Globe,
 Menu,
 Coffee,
 X,
 ChevronDown,
 ShieldCheck,
 Truck,
 Bean,
 ArrowLeft
} from 'lucide-react';

interface HeaderProps {
 onOpenSearch: () => void;
 onNavigate: (path: string) => void;
 onOpenCart?: () => void;
 onOpenAuth?: () => void;
 currentPath?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onNavigate, currentPath = '/', onOpenAuth }) => {
 const { language, setLanguage, t } = useLanguage();
 const { currency, setCurrency, formatPriceString } = useCurrency();
 const { totalItemCount, openCart, subtotal } = useCart();
 const { wishlistCount } = useWishlist();
 const { user, isAdmin } = useAuth();

 const [announcement, setAnnouncement] = useState<AnnouncementBarConfig | null>(null);
 const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [megaTop, setMegaTop] = useState(90);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
 const [isScrolled, setIsScrolled] = useState(false);

 const announcementText = announcement ? (language === 'ar' ? announcement.text_ar : announcement.text_en) : '';
 const freeShipThreshold = announcement?.free_shipping_threshold || 0;
 const freeShipRemaining = Math.max(0, freeShipThreshold - subtotal);
 const freeShipEligible = freeShipThreshold > 0 && freeShipRemaining <= 0;

  useEffect(() => {
    fetch('/api/public/announcement')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setAnnouncement(data); })
      .catch(err => console.error(err));

 const handleScroll = () => {
 setIsScrolled(window.scrollY > 20);
 };
 window.addEventListener('scroll', handleScroll);
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 const renderAnnouncementContent = () => (
 <>
 <button
 onClick={() => setShowAnnouncement(false)}
 className="absolute top-1.5 left-1.5 z-10 opacity-60 hover:opacity-100 p-1 cursor-pointer transition"
 aria-label="Dismiss"
 >
 <X className="w-3.5 h-3.5" />
 </button>

 <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 pr-8">
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-2 min-w-0">
 <Bean className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 opacity-80" />
 <p className="font-amiri text-sm sm:text-lg leading-snug font-bold truncate">
 {announcementText}
 </p>
 </div>

 {announcement.link && announcement.show_button !== false && (
 <button
 onClick={() => onNavigate(announcement.link!)}
 className="shrink-0 hidden sm:flex items-center gap-1.5 rounded-full bg-gradient-to-l from-[#6CC6C9] to-[#0E5257] text-[#FFFFFF] px-4 sm:px-5 py-2 text-xs sm:text-sm font-extrabold cursor-pointer hover:brightness-110 transition shadow-[0_6px_20px_-6px_rgba(217,155,38,0.65)]"
 >
 <span>
 {language === 'ar' && announcement.cta_text_ar
 ? announcement.cta_text_ar
 : language === 'en' && announcement.cta_text_en
 ? announcement.cta_text_en
 : t('تسوق الآن', 'Shop Now')}
 </span>
 <ArrowLeft className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
 {freeShipThreshold > 0 && (
 <div className="flex items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1 text-[10px] sm:text-xs font-bold opacity-90">
 <Truck className="w-3 h-3" />
 {freeShipEligible
 ? t('شحن مجاني ✓', 'Free shipping ✓')
 : t('متبقي ' + formatPriceString(freeShipRemaining) + ' للشحن المجاني', formatPriceString(freeShipRemaining) + ' to free shipping')}
 </div>
 )}
 </div>
 </div>
 </>
 );

 return (
 <header className="sticky top-0 z-40 bg-[#FFFFFF]/85 text-[#1A2E30] border-b border-[#E8F2F2] transition-all backdrop-blur-xl max-w-full overflow-x-clip">
 {/* Announcement — Featured Offer Card */}
 {showAnnouncement && announcement && announcement.is_enabled && (
 announcement.show_frame === false ? (
 /* Full-bleed: no card box / no frame */
 <div
 className="offer-enter relative overflow-hidden"
 style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
 >
 {announcement.bg_image && (
 <img src={announcement.bg_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
 )}
 {announcement.overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />}
 <div className="relative max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
 {renderAnnouncementContent()}
 </div>
 </div>
 ) : (
 /* Gold-framed card */
 <div className="offer-enter relative max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-1.5 sm:pt-2">
 <div className="relative rounded-2xl bg-gradient-to-l from-[#6CC6C9]/60 via-[#0E5257]/25 to-[#6CC6C9]/60 p-px shadow-[0_12px_45px_-14px_rgba(217,155,38,0.45)]">
 <div
 className="relative rounded-[calc(1rem-1px)] overflow-hidden"
 style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
 >
 {announcement.bg_image && (
 <img src={announcement.bg_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
 )}
 {announcement.overlay && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />}
 <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30 pointer-events-none" />
 <div className="relative">{renderAnnouncementContent()}</div>
 </div>
 </div>
 </div>
 )
 )}

 {/* Main Top Header Bar */}
 <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-4">

 {/* Mobile Hamburger & Logo */}
 <div className="flex items-center gap-2 sm:gap-3 shrink-0">
 <button
 onClick={() => setIsMobileMenuOpen(true)}
 className="lg:hidden p-1.5 sm:p-2 rounded-lg text-[#6CC6C9] hover:bg-[#F0FAFA] transition cursor-pointer"
 aria-label="Toggle Mobile Menu"
 >
 <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
 </button>

 {/* Logo (Selectable / Editable) */}
 <div
 onClick={() => onNavigate('/')}
 className="cursor-pointer group select-text"
 >
 <img
 src="/coloredlogo.png"
 alt="Selection Store"
 className="h-8 sm:h-10 w-auto group-hover:scale-105 transition duration-300 shrink-0"
 />
 </div>
 </div>

 {/* Desktop Navigation Links */}
 <div
 className="hidden lg:flex items-center gap-7 text-sm font-medium"
 onMouseLeave={() => setIsMegaMenuOpen(false)}
 >
 <button
 onClick={() => onNavigate('/')}
 className={`hover:text-[#6CC6C9] transition py-1 border-b-2 cursor-pointer ${currentPath === '/' ? 'text-[#6CC6C9] border-[#6CC6C9]' : 'border-transparent text-[#1A2E30]'
 }`}
 >
 {t('الرئيسية', 'Home')}
 </button>

  {/* Mega Menu Trigger */}
  <div
  className="relative"
  onMouseEnter={e => {
  setMegaTop(e.currentTarget.getBoundingClientRect().bottom + 8);
  setIsMegaMenuOpen(true);
  }}
  >
 <button
 onClick={() => onNavigate('/products')}
 className={`flex items-center gap-1.5 hover:text-[#6CC6C9] transition py-1 border-b-2 cursor-pointer ${(currentPath || '').startsWith('/products') || (currentPath || '').startsWith('/category')
 ? 'text-[#6CC6C9] border-[#6CC6C9]'
 : 'border-transparent text-[#1A2E30]'
 }`}
 >
 <span>{t('متجر القهوة والمعدات', 'Coffee & Gear Shop')}</span>
 <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180 text-[#6CC6C9]' : ''}`} />
 </button>

  {/* Mega Menu drops below header */}
  <MegaMenu
  isOpen={isMegaMenuOpen}
  top={megaTop}
  onClose={() => setIsMegaMenuOpen(false)}
  onNavigate={onNavigate}
  />
 </div>

 <button
 onClick={() => onNavigate('/about')}
 className={`hover:text-[#6CC6C9] transition py-1 border-b-2 cursor-pointer ${currentPath === '/about' ? 'text-[#6CC6C9] border-[#6CC6C9]' : 'border-transparent text-[#1A2E30]'
 }`}
 >
 {t('عن المحمصة', 'About Us')}
 </button>

 <button
 onClick={() => onNavigate('/wholesale')}
 className={`hover:text-[#6CC6C9] transition py-1 border-b-2 cursor-pointer ${currentPath === '/wholesale' ? 'text-[#6CC6C9] border-[#6CC6C9]' : 'border-transparent text-[#1A2E30]'
 }`}
 >
 {t('طلب مبيعات الجملة', 'Wholesale')}
 </button>
 </div>

 {/* Right Action Icons & Selectors */}
 <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">

 {/* Currency Selector - Desktop only */}
 <div className="relative hidden md:block">
 <button
 onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
 className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[#F0FAFA] text-[#4A6869] hover:text-[#1A2E30] hover:bg-[#E8F2F2] transition border border-[#E8F2F2] cursor-pointer"
 >
 <span>{currency}</span>
 <ChevronDown className="w-3 h-3" />
 </button>

 {isCurrencyDropdownOpen && (
 <div className="absolute top-full mt-2 left-0 right-0 w-24 bg-[#F0FAFA] border border-[#E8F2F2] rounded-xl shadow-2xl py-1 z-50">
 {Object.keys(currencies).map(c => (
 <button
 key={c}
 onClick={() => {
 setCurrency(c as Currency);
 setIsCurrencyDropdownOpen(false);
 }}
 className={`w-full text-center px-3 py-1.5 text-xs hover:bg-[#0E5257]/30 transition cursor-pointer ${currency === c ? 'text-[#6CC6C9] font-bold' : 'text-[#1A2E30]'
 }`}
 >
 {c}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Language Switcher - Desktop only */}
 <button
 onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
 className="hidden md:flex p-2 rounded-lg text-[#4A6869] hover:text-[#1A2E30] hover:bg-[#F0FAFA] transition text-xs font-semibold items-center gap-1 border border-[#E8F2F2] cursor-pointer"
 title="Switch Language"
 >
 <Globe className="w-3.5 h-3.5 text-[#6CC6C9]" />
 <span>{language === 'ar' ? 'EN' : 'العربية'}</span>
 </button>

 {/* Search Overlay Trigger */}
 <button
 onClick={onOpenSearch}
 className="p-1.5 sm:p-2 rounded-lg text-[#4A6869] hover:text-[#6CC6C9] hover:bg-[#F0FAFA] transition cursor-pointer"
 title={t('بحث', 'Search')}
 >
 <Search className="w-4 h-4 sm:w-5 sm:h-5" />
 </button>

 {/* Wishlist Button */}
 <button
 onClick={() => onNavigate('/account?tab=wishlist')}
 className="relative p-1.5 sm:p-2 rounded-lg text-[#4A6869] hover:text-[#6CC6C9] hover:bg-[#F0FAFA] transition cursor-pointer hidden sm:flex"
 title={t('المفضلة', 'Wishlist')}
 >
 <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
 {wishlistCount > 0 && (
 <span className="absolute -top-1 -right-1 bg-[#0E5257] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
 {wishlistCount}
 </span>
 )}
 </button>

 {/* Account Icon */}
 <button
 onClick={() => {
 if (user) {
 onNavigate(isAdmin ? '/admin' : '/account');
 } else if (onOpenAuth) {
 onOpenAuth();
 } else {
 onNavigate('/account');
 }
 }}
 className="p-1.5 sm:p-2 rounded-lg text-[#4A6869] hover:text-[#6CC6C9] hover:bg-[#F0FAFA] transition flex items-center gap-1 cursor-pointer"
 title={user ? user.name : t('تسجيل الدخول', 'Sign In')}
 >
 <User className="w-4 h-4 sm:w-5 sm:h-5" />
 {isAdmin && (
 <span className="hidden md:inline text-[10px] bg-[#6CC6C9] text-black font-bold px-1.5 py-0.5 rounded">
 ADMIN
 </span>
 )}
 </button>

 {/* Cart Drawer Button */}
 <button
 onClick={openCart}
 className="relative flex items-center gap-1 sm:gap-2 bg-[#0E5257] hover:bg-[#2B7D82] text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition shadow-lg shadow-[#0E5257]/20 cursor-pointer font-medium text-xs sm:text-sm ml-0.5"
 >
 <ShoppingBag className="w-4 h-4" />
 <span className="hidden sm:inline">{t('السلة', 'Cart')}</span>
 {totalItemCount > 0 && (
 <span className="bg-[#6CC6C9] text-black font-bold text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
 {totalItemCount}
 </span>
 )}
 </button>

 </div>
 </div>
 </div>

 {/* Mobile Drawer - portaled outside header to avoid overflow-x-clip */}
 {createPortal(
 <MobileMenuDrawer
 isOpen={isMobileMenuOpen}
 onClose={() => setIsMobileMenuOpen(false)}
 onNavigate={onNavigate}
 />,
 document.body
 )}
 </header>
 );
};

export default Header;
