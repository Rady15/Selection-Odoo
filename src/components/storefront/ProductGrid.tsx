import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import { Coffee } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ProductGridProps {
 products: Product[];
 onNavigate: (path: string) => void;
 onQuickView?: (product: Product) => void;
 loading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onNavigate, onQuickView, loading }) => {
 const { t } = useLanguage();

 if (loading) {
 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
 <div key={n} className="bg-[#F0FAFA] border border-[#E8F2F2] rounded-2xl h-80 animate-pulse p-4 space-y-4">
 <div className="bg-[#E8F2F2] rounded-xl h-44 w-full" />
 <div className="bg-[#E8F2F2] h-4 rounded w-3/4" />
 <div className="bg-[#E8F2F2] h-4 rounded w-1/2" />
 </div>
 ))}
 </div>
 );
 }

 if (products.length === 0) {
 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="text-center py-20 space-y-3 bg-[#F0FAFA] border border-[#E8F2F2] rounded-2xl p-8"
 >
 <Coffee className="w-12 h-12 text-[#0E5257] mx-auto" />
 <h3 className="font-bold text-lg text-[#1A2E30]">
 {t('لا توجد منتجات مطابقة لهذا التصفية', 'No products matching this filter')}
 </h3>
 <p className="text-xs text-[#6B8C8E]">
 {t('جرّب اختيار قسم آخر أو تغيير نطاق السعر للوصول للقهوة المطلوبة.', 'Try selecting another category or clearing price filters.')}
 </p>
 </motion.div>
 );
 }

 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {products.map((prod, idx) => (
 <motion.div
 key={prod.id}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-20px' }}
 transition={{ duration: 0.4, delay: (idx % 4) * 0.08 }}
 >
 <ProductCard
 product={prod}
 onNavigate={onNavigate}
 onQuickView={onQuickView}
 />
 </motion.div>
 ))}
 </div>
 );
};

export default ProductGrid;
