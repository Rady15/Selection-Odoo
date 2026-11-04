import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface WishlistContextType {
 wishlistIds: string[];
 toggleWishlist: (productId: string) => void;
 isInWishlist: (productId: string) => boolean;
 wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { user } = useAuth();
 const storageKey = `fursan_wishlist_${user?.id || 'guest'}`;

 const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
 try {
 const saved = localStorage.getItem(storageKey);
 const parsed = saved ? JSON.parse(saved) : [];
 return Array.isArray(parsed) ? parsed : [];
 } catch {
 return [];
 }
 });

 // Switching account (or logging out) reloads that user's own wishlist.
 useEffect(() => {
 try {
 const saved = localStorage.getItem(storageKey);
 const parsed = saved ? JSON.parse(saved) : [];
 setWishlistIds(Array.isArray(parsed) ? parsed : []);
 } catch {
 setWishlistIds([]);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [storageKey]);

 useEffect(() => {
 try {
 localStorage.setItem(storageKey, JSON.stringify(wishlistIds));
 } catch {
 /* storage unavailable */
 }
 }, [wishlistIds, storageKey]);

 const toggleWishlist = (productId: string) => {
 setWishlistIds(prev => {
 if (prev.includes(productId)) {
 return prev.filter(id => id !== productId);
 } else {
 return [...prev, productId];
 }
 });
 };

 const isInWishlist = (productId: string) => {
 return wishlistIds.includes(productId);
 };

 return (
 <WishlistContext.Provider value={{
 wishlistIds,
 toggleWishlist,
 isInWishlist,
 wishlistCount: wishlistIds.length
 }}>
 {children}
 </WishlistContext.Provider>
 );
};

export const useWishlist = () => {
 const context = useContext(WishlistContext);
 if (!context) throw new Error('useWishlist must be used within WishlistProvider');
 return context;
};
