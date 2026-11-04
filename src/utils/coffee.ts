import { GrindType } from '../types';

export const grindLabels: Record<GrindType, { ar: string; en: string; icon: string }> = {
 beans: { ar: 'حبوب كاملة (بدون طحن)', en: 'Whole Beans', icon: 'Bean' },
 v60: { ar: 'طحنة V60 / فلتر تقطير', en: 'V60 / Drip Filter', icon: 'Filter' },
 espresso: { ar: 'طحنة إسبرسو ناعمة', en: 'Espresso Fine', icon: 'Coffee' },
 french_press: { ar: 'طحنة فرنش بريس خشنة', en: 'French Press Coarse', icon: 'GlassWater' },
 aeropress: { ar: 'طحنة أيروبريس متوسطة', en: 'Aeropress Medium', icon: 'Sliders' },
 cold_brew: { ar: 'طحنة كولد برو خشنة جداً', en: 'Cold Brew Very Coarse', icon: 'CupSoda' },
 turkish: { ar: 'طحنة قهوة تركية/سعودية ناعمة جداً', en: 'Turkish / Saudi Fine', icon: 'Flame' }
};

export const saudiCities = [
 { id: 'riyadh', name_ar: 'الرياض', name_en: 'Riyadh' },
 { id: 'jeddah', name_ar: 'جدة', name_en: 'Jeddah' },
 { id: 'dammam', name_ar: 'الدمام', name_en: 'Dammam' },
 { id: 'khobar', name_ar: 'الخبر', name_en: 'Khobar' },
 { id: 'mecca', name_ar: 'مكة المكرمة', name_en: 'Mecca' },
 { id: 'medina', name_ar: 'المدينة المنورة', name_en: 'Medina' },
 { id: 'dhahran', name_ar: 'الظهران', name_en: 'Dhahran' },
 { id: 'buraidah', name_ar: 'القصيم - بريدة', name_en: 'Buraidah' },
 { id: 'tabuk', name_ar: 'تبوك', name_en: 'Tabuk' },
 { id: 'abha', name_ar: 'أبها', name_en: 'Abha' },
 { id: 'khamis', name_ar: 'خميس مشيط', name_en: 'Khamis Mushait' },
 { id: 'hail', name_ar: 'حائل', name_en: 'Hail' },
 { id: 'jubail', name_ar: 'الجبيل', name_en: 'Jubail' },
 { id: 'taif', name_ar: 'الطائف', name_en: 'Taif' },
 { id: 'jazan', name_ar: 'جازان', name_en: 'Jazan' }
];

export const shippingProviders = [
 { id: 'aramex', name_ar: 'أرامكس إكسبرس', name_en: 'Aramex Express', estimatedDays_ar: '1-3 أيام عمل', estimatedDays_en: '1-3 business days', priceSAR: 28 },
 { id: 'smsa', name_ar: 'سمسا إكسبرس', name_en: 'SMSA Express', estimatedDays_ar: '1-3 أيام عمل', estimatedDays_en: '1-3 business days', priceSAR: 25 },
 { id: 'fastlo', name_ar: 'فاستلو - توصيل للمنزل', name_en: 'Fastlo Local Express', estimatedDays_ar: 'توصيل في نفس اليوم بالرياض', estimatedDays_en: 'Same day delivery in Riyadh', priceSAR: 22 },
 { id: 'store_pickup', name_ar: 'استلام مباشر من المحمصة (حي حطين)', name_en: 'Store Pickup (Hittin, Riyadh)', estimatedDays_ar: 'جاهز خلال ساعتين', estimatedDays_en: 'Ready in 2 hours', priceSAR: 0 }
];
