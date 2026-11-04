export type Language = 'ar' | 'en';
export type Currency = 'SAR' | 'AED' | 'KWD' | 'QAR' | 'BHD' | 'OMR' | 'USD';

export interface CurrencyConfig {
 code: Currency;
 symbol_ar: string;
 symbol_en: string;
 rateFromSAR: number;
}

export type GrindType = 'beans' | 'v60' | 'espresso' | 'french_press' | 'aeropress' | 'cold_brew' | 'turkish';

export type ProductUnitType = 'weight' | 'piece' | 'unit' | 'box' | 'liter' | 'meter' | 'custom';

export interface ProductWeightOption {
 value: string; // e.g., "250g", "1kg", "1piece", "6box"
 label_ar: string;
 label_en: string;
 priceModifier: number; // e.g. 0 for 250g, 45 for 500g, 110 for 1kg
 skuSuffix: string;
}

export interface FlavorProfile {
 acidity: number; // 1-5
 sweetness: number; // 1-5
 body: number; // 1-5
 balance: number; // 1-5
 strength?: number; // 1-5
 bitterness?: number; // 1-5
 caffeine?: number; // 1-5
}

export type CoffeeRoastLevel = 'light' | 'medium' | 'dark';

export interface CoffeeProfile {
 roast_level?: CoffeeRoastLevel;
 brew_methods: GrindType[];
 strength: number; // 1-5
 acidity: number; // 1-5
 sweetness: number; // 1-5
 body: number; // 1-5
 balance: number; // 1-5
 bitterness: number; // 1-5
 caffeine: number; // 1-5
 flavor_notes: string[];
}

export interface ProductVariant {
 id: string;
 sku: string;
 weight: string;
 grind: GrindType;
 price: number;
 sale_price?: number;
 stock: number;
}

export interface Product {
 id: string;
 slug: string;
 category_slug?: string;
 name_ar: string;
 name_en: string;
 subtitle_ar: string;
 subtitle_en: string;
 description_ar: string;
 description_en: string;
 category_id: string;
 unit_type?: ProductUnitType;
 unit_label_ar?: string;
 unit_label_en?: string;
 subcategory_id?: string;
 price: number;
 sale_price?: number;
 is_new?: boolean;
 is_bestseller?: boolean;
 is_featured?: boolean;
 is_roasters_choice?: boolean;
 rating: number;
 review_count: number;
 sold_count: number;
 sku: string;
 stock: number;
 tasting_notes_ar: string[];
 tasting_notes_en: string[];
 origin_country_ar: string;
 origin_country_en: string;
 region_ar: string;
 region_en: string;
 altitude: string;
 process_ar: string;
 process_en: string;
 roast_level_ar: string;
 roast_level_en: string;
 variety: string;
  flavor_profile: FlavorProfile;
  coffee_profile?: CoffeeProfile;
  recommendation_enabled?: boolean;
  sca_score?: number;
  brew_method?: string;
  brew_ratio?: string;
  brew_temp?: string;
  brew_time?: string;
 images: string[];
 grind_options: GrindType[];
 weight_options: ProductWeightOption[];
 variants: ProductVariant[];
 created_at: string;
}

export interface Category {
 id: string;
 slug: string;
 name_ar: string;
 name_en: string;
 description_ar?: string;
 description_en?: string;
 image?: string;
 icon?: string;
 parent_id?: string;
 sort_order: number;
 featured?: boolean;
}

export interface CartItem {
 id: string; // unique item id in cart (product_id + weight + grind)
 product_id: string;
 product: Product;
 selected_weight: string;
 selected_grind: GrindType;
 quantity: number;
 unit_price: number;
}

export interface Address {
 id: string;
 title: string;
 full_name: string;
 phone: string;
 country: string;
 city: string;
 district: string;
 street: string;
 building?: string;
 postal_code?: string;
 delivery_notes?: string;
 is_default: boolean;
}

export interface User {
 id: string;
 name: string;
 email: string;
 phone: string;
 role: 'admin' | 'customer';
 loyalty_points: number;
 addresses: Address[];
 created_at: string;
 /** @deprecated Legacy field; never return or use for new passwords. */
 password?: string;
 password_hash?: string;
 blocked?: boolean;
}

export type OrderStatus = 'pending' | 'paid' | 'roasting' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'mada' | 'apple_pay' | 'visa' | 'cod' | 'tabby' | 'tamara' | 'paymob';
export type ShippingMethod = 'smsa' | 'aramex' | 'fastlo' | 'store_pickup';

export interface OrderItem {
 product_id: string;
 product_name_ar: string;
 product_name_en: string;
 image: string;
 weight: string;
 grind: GrindType;
 quantity: number;
 unit_price: number;
 total_price: number;
 sku: string;
}

export interface OrderStatusHistoryItem {
 status: OrderStatus;
 timestamp: string;
 note_ar: string;
 note_en: string;
}

export interface Order {
 id: string;
 order_number: string;
 user_id?: string;
 customer_name: string;
 email: string;
 phone: string;
 shipping_address: Address;
 items: OrderItem[];
 subtotal: number;
 discount_amount: number;
 coupon_code?: string;
 loyalty_points_used?: number;
 loyalty_discount?: number;
 loyalty_points_earned?: number;
 cod_surcharge?: number;
 shipping_cost: number;
 tax_amount: number; // 15% VAT
 total_amount: number;
 payment_method: PaymentMethod;
 payment_status: 'paid' | 'pending' | 'failed';
 payment_intent_id?: string;
 shipping_method: ShippingMethod;
 tracking_number?: string;
 tracking_url?: string;
 status: OrderStatus;
 status_history: OrderStatusHistoryItem[];
 customer_notes?: string;
 created_at: string;
}

export interface Coupon {
 id: string;
 code: string;
 discount_type: 'percentage' | 'fixed' | 'free_shipping';
 discount_value: number;
 discount_percentage?: number;
 min_order_amount: number;
 min_order_amount_sar?: number;
 max_discount_amount?: number;
 valid_until: string;
 usage_count: number;
 usage_limit: number;
 is_active: boolean;
}

export interface Review {
 id: string;
 product_id: string;
 user_id?: string;
 customer_name: string;
 rating: number; // 1-5
 title: string;
 comment: string;
 images?: string[];
 verified_purchase: boolean;
 status: 'approved' | 'pending' | 'rejected';
 created_at: string;
 staff_reply_ar?: string;
 staff_reply_en?: string;
}

export interface ProductQuestion {
 id: string;
 product_id: string;
 customer_name: string;
 question: string;
 answer_ar?: string;
 answer_en?: string;
 status: 'approved' | 'pending';
 created_at: string;
}

export interface StockNotification {
 id: string;
 product_id: string;
 product_name_ar: string;
 product_name_en: string;
 variant_info: string;
 customer_name: string;
 email: string;
 phone: string;
 status: 'pending' | 'notified';
 created_at: string;
}

export interface LoyaltyTransaction {
 id: string;
 user_id: string;
 type: 'earned' | 'redeemed' | 'bonus';
 points: number;
 amount_sar: number;
 order_id?: string;
 description_ar: string;
 description_en: string;
 created_at: string;
}

export interface HeroSlide {
 id: string;
 title_ar: string;
 title_en: string;
 subtitle_ar: string;
 subtitle_en: string;
 cta_text_ar: string;
 cta_text_en: string;
 cta_link: string;
  image_desktop: string;
  image_mobile: string;
  // Slide background fallback (e.g. linked product photo) used when the CMS
  // image is missing or a tiny placeholder.
  fallback_image?: string;
  // Optional local banner override: /hero-banners/<slide-id>.png|jpg in public/
  local_image?: string;
 badge_ar?: string;
 badge_en?: string;
 background_overlay?: string;
}

export interface HomepageSection {
 id: string;
 type: 'hero_slider' | 'featured_categories' | 'product_carousel' | 'values_carousel' | 'coffee_quiz' | 'roastery_story' | 'banner' | 'benefits' | 'testimonials' | 'newsletter';
 title_ar?: string;
 title_en?: string;
 subtitle_ar?: string;
 subtitle_en?: string;
 is_enabled: boolean;
 sort_order: number;
 config: any;
}

export interface AnnouncementBarConfig {
 is_enabled: boolean;
 text_ar: string;
 text_en: string;
 link?: string;
 bg_color: string;
 text_color: string;
 free_shipping_threshold: number; // e.g. 199
 cta_text_ar?: string;
 cta_text_en?: string;
 bg_image?: string; // background image URL (uploads/...)
 overlay?: boolean; // dark overlay over the background
 show_button?: boolean; // false hides the CTA button
 show_frame?: boolean; // false removes the gold frame / card box
}

export interface StoreSettings {
 store_name_ar: string;
 store_name_en: string;
 vat_number: string;
 vat_rate: number; // e.g. 0.15
 free_shipping_threshold: number;
 default_currency: Currency;
 support_phone: string;
 support_email: string;
 whatsapp_number: string;
 address_ar: string;
 address_en: string;
 instagram_url: string;
 twitter_url: string;
 tiktok_url: string;
 enable_loyalty: boolean;
 points_per_sar: number; // e.g. 1 point per 10 SAR
 sar_per_point: number; // e.g. 1 SAR per 10 points
}

export interface WholesaleSubmission {
 id: string;
 business_name: string;
 contact_name: string;
 email: string;
 phone: string;
 city: string;
 business_type: string;
 monthly_coffee_kg: string;
 message: string;
 status: 'new' | 'contacted' | 'approved' | 'rejected';
 created_at: string;
}

export interface WholesaleRequest {
 id: string;
 company_name: string;
 contact_name: string;
 email: string;
 phone: string;
 city: string;
 estimated_monthly_volume: string;
 created_at: string;
}

export interface ContactSubmission {
 id: string;
 name: string;
 email: string;
 phone: string;
 subject: string;
 message: string;
 status: 'new' | 'resolved';
 reply_ar?: string;
 reply_en?: string;
 replied_at?: string;
 created_at: string;
}

export type QuizMatchField =
  | 'brew_method'
  | 'roast_level'
  | 'flavor'
  | 'strength'
  | 'acidity'
  | 'sweetness'
  | 'body'
  | 'balance'
  | 'bitterness'
  | 'caffeine';

export interface QuizPreferences {
  fields: QuizMatchField[];
  brew_methods: GrindType[];
  roast_levels: CoffeeRoastLevel[];
  flavors: string[];
  strength?: number;
  acidity?: number;
  sweetness?: number;
  body?: number;
  balance?: number;
  bitterness?: number;
  caffeine?: number;
}

export interface QuizOption {
 id: string;
 label_ar: string;
 label_en: string;
 icon: string;
 image_url?: string;
 preferences?: QuizPreferences;
}

export interface QuizQuestion {
 id: string;
 title_ar: string;
 title_en: string;
 options: QuizOption[];
 is_enabled: boolean;
 sort_order: number;
}

export interface QuizSettings {
 results_count: number;
 badge_ar: string;
 badge_en: string;
 title_ar: string;
 title_en: string;
 subtitle_ar: string;
 subtitle_en: string;
}

export interface QuizConfig {
 questions: QuizQuestion[];
 settings: QuizSettings;
}

export interface AssistantQuickAction {
 id: string;
 label_ar: string;
 label_en: string;
 prompt_ar: string;
 prompt_en: string;
}
export interface AssistantConfig {
 enabled: boolean;
 name_ar: string;
 name_en: string;
 welcome_ar: string;
 welcome_en: string;
 avatar_url?: string;
 quick_actions: AssistantQuickAction[];
}

export interface Banner {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  image_url: string;
  link_url: string;
  position: 'hero' | 'mid_page' | 'footer' | 'sidebar';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  bg_color: string;
  text_color: string;
  sort_order: number;
  created_at: string;
}

export interface PaymentGatewayConfig {
  id: string; // 'stripe' | 'cod' | 'paymob' | 'fawry' | 'tabby' | 'tamara'
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  enabled: boolean;
  mode: 'test' | 'live';
  currency: string;
  publishable_key?: string;
  secret_key?: string;
  secret_key_configured?: boolean;
  secret_key_masked?: string;
  webhook_secret?: string;
  webhook_secret_configured?: boolean;
  webhook_secret_masked?: string;
  supported_methods: string[];
  test_status?: 'connected' | 'error' | 'untested';
  test_message?: string;
  additional_settings?: Record<string, any>;
}

export interface ShippingProviderConfig {
  id: string; // 'smsa' | 'aramex' | 'fastlo' | 'store_pickup' | custom
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  enabled: boolean;
  base_fee: number; // SAR flat fee (0 = free)
  cod_supported: boolean;
  tracking_url_template?: string; // e.g. https://.../tracking/{tracking_number}
  api_base_url?: string;
  api_key?: string;
  api_key_configured?: boolean;
  api_key_masked?: string;
  account?: string;
  password?: string;
  additional_settings?: Record<string, any>;
}
