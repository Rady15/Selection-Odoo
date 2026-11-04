import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Product, Category, ProductUnitType, ProductWeightOption, CoffeeRoastLevel, GrindType } from '../../types';
import { Plus, Trash2, Edit, Search, X, Image as ImageIcon, Package, Save, Loader2 } from 'lucide-react';
import ImageGalleryUploader from './ImageGalleryUploader';
import { BulkDeleteBar, BulkDeleteConfirm, bulkDeleteRequest } from './BulkDeleteBar';

const UNIT_OPTIONS: {value:ProductUnitType; ar:string; en:string; suffix:string}[] = [
 {value:'weight',ar:'وزن',en:'Weight',suffix:'g'}, {value:'piece',ar:'حبة',en:'Piece',suffix:'piece'}, {value:'unit',ar:'قطعة / وحدة',en:'Unit',suffix:'unit'}, {value:'box',ar:'بوكس / صندوق',en:'Box',suffix:'box'}, {value:'liter',ar:'لتر',en:'Liter',suffix:'L'}, {value:'meter',ar:'متر',en:'Meter',suffix:'m'}, {value:'custom',ar:'وحدة مخصصة',en:'Custom',suffix:'unit'}
];
const emptyOption = (unit: ProductUnitType): ProductWeightOption => ({value: unit==='weight'?'250g':'1'+(UNIT_OPTIONS.find(x=>x.value===unit)?.suffix||'unit'), label_ar:unit==='weight'?'250 جرام':'1 وحدة', label_en:unit==='weight'?'250g':'1 unit', priceModifier:0, skuSuffix:'-1'});
const ROAST_OPTIONS: {value: CoffeeRoastLevel; ar: string; en: string}[] = [
 {value:'light', ar:'فاتح', en:'Light'}, {value:'medium', ar:'متوسط', en:'Medium'}, {value:'dark', ar:'غامق', en:'Dark'}
];
const BREW_OPTIONS: {value: GrindType; ar: string; en: string}[] = [
 {value:'v60', ar:'V60 / فلتر', en:'V60 / Filter'}, {value:'espresso', ar:'إسبريسو', en:'Espresso'},
 {value:'french_press', ar:'فرنش بريس', en:'French Press'}, {value:'aeropress', ar:'أيروبريس', en:'Aeropress'},
 {value:'cold_brew', ar:'كولد برو', en:'Cold Brew'}, {value:'turkish', ar:'تركية / سعودية', en:'Turkish / Saudi'},
 {value:'beans', ar:'حبوب كاملة', en:'Whole Beans'}
];
const emptyCoffeeProfile = () => ({
 roast_level:'medium' as CoffeeRoastLevel,
 brew_methods:['v60','espresso'] as GrindType[],
 strength:3, acidity:3, sweetness:3, body:3, balance:3, bitterness:3, caffeine:3,
 flavor_notes:[] as string[]
});


export const AdminProductsManager: React.FC = () => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const [form, setForm] = useState<any>({
    name_ar: '',
    name_en: '',
    slug: '',
    category_id: '',
    category_slug: '',
    price: 0,
    sale_price: '',
    stock: 0,
    sku: '',
    subtitle_ar: '',
    subtitle_en: '',
    description_ar: '',
    description_en: '',
    origin_country_ar: '',
    origin_country_en: '',
    region_ar: '',
    region_en: '',
    altitude: '',
    process_ar: '',
    process_en: '',
    roast_level_ar: '',
    roast_level_en: '',
    variety: '',
    rating: 0,
    review_count: 0,
    is_new: false,
    is_bestseller: false,
    is_featured: false,
    is_roasters_choice: false,
    recommendation_enabled: false,
    coffee_profile: emptyCoffeeProfile(),
    flavor_profile: { acidity: 1, sweetness: 1, body: 1, balance: 1 },
    tasting_notes_ar: '',
    tasting_notes_en: '',
    unit_type: 'weight',
    unit_label_ar: '',
    unit_label_en: '',
    images: [],
    weight_options: [],
    grind_options: ['beans', 'v60', 'espresso']
  });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      if (pRes.ok && cRes.ok) {
        const p = await pRes.json();
        const c = await cRes.json();
        setProducts(Array.isArray(p) ? p : []);
        setCategories(Array.isArray(c) ? c : []);
        setSelectedIds(new Set());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    const c = categories[0];
    const unit = 'weight' as ProductUnitType;
    setEditing(null);
    setForm({
      name_ar: '',
      name_en: '',
      slug: '',
      category_id: c?.id || '',
      category_slug: c?.slug || '',
      price: 0,
      sale_price: '',
      stock: 0,
      sku: '',
      subtitle_ar: '',
      subtitle_en: '',
      description_ar: '',
      description_en: '',
      origin_country_ar: '',
      origin_country_en: '',
      region_ar: '',
      region_en: '',
      altitude: '',
      process_ar: '',
      process_en: '',
      roast_level_ar: '',
      roast_level_en: '',
      variety: '',
      rating: 0,
      review_count: 0,
      is_new: false,
      is_bestseller: false,
      is_featured: false,
      is_roasters_choice: false,
      recommendation_enabled: false,
      coffee_profile: emptyCoffeeProfile(),
      flavor_profile: { acidity: 1, sweetness: 1, body: 1, balance: 1 },
      tasting_notes_ar: '',
      tasting_notes_en: '',
      unit_type: unit,
      unit_label_ar: 'جرام',
      unit_label_en: 'g',
      images: [],
      weight_options: [emptyOption(unit)],
      grind_options: ['beans', 'v60', 'espresso']
    });
    setError('');
    setShow(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    const cat = categories.find(c => c.id === p.category_id) || categories.find(c => c.slug === p.category_slug);
    setForm({
      ...p,
      category_id: cat?.id || p.category_id || '',
      category_slug: cat?.slug || p.category_slug || '',
      sale_price: p.sale_price ?? '',
      images: Array.isArray(p.images) ? p.images : [],
      weight_options: Array.isArray(p.weight_options) && p.weight_options.length ? p.weight_options : [emptyOption((p.unit_type || 'weight') as ProductUnitType)],
      grind_options: Array.isArray(p.grind_options) ? p.grind_options : [],
      recommendation_enabled: p.recommendation_enabled !== false,
      coffee_profile: p.coffee_profile || emptyCoffeeProfile(),
      tasting_notes_ar: (p.tasting_notes_ar || []).join('، '),
      tasting_notes_en: (p.tasting_notes_en || []).join(', ')
    });
    setError('');
    setShow(true);
  };

  const update = (k: string, v: any) => setForm((x: any) => ({ ...x, [k]: v }));
  const changeCategory = (id: string) => {
    const c = categories.find(x => x.id === id);
    setForm((x: any) => ({ ...x, category_id: id, category_slug: c?.slug || '' }));
  };

  const changeUnit = (unit: ProductUnitType) => {
    setForm((x: any) => {
      const existing = x.weight_options || [];
      return {
        ...x,
        unit_type: unit,
        weight_options: existing.length > 0 ? existing : [emptyOption(unit)]
      };
    });
  };

  const updateOpt = (i: number, k: keyof ProductWeightOption, v: any) => setForm((x: any) => {
    const a = [...(x.weight_options || [])];
    a[i] = { ...a[i], [k]: k === 'priceModifier' ? Number(v) : v };
    return { ...x, weight_options: a };
  });

  const addOpt = () => setForm((x: any) => ({
    ...x,
    weight_options: [...(x.weight_options || []), emptyOption(x.unit_type || 'weight')]
  }));

  const removeOpt = (i: number) => setForm((x: any) => ({
    ...x,
    weight_options: x.weight_options.filter((_: any, j: number) => j !== i)
  }));

  const toggleGrindOption = (grind: GrindType) => {
    setForm((x: any) => {
      const current = x.grind_options || [];
      const updated = current.includes(grind)
        ? current.filter((g: string) => g !== grind)
        : [...current, grind];
      return { ...x, grind_options: updated };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.category_id) return setError(t('اختر فئة المنتج أولاً', 'Select a product category first'));
    if (!form.images.length) return setError(t('أضف صورة واحدة على الأقل للمنتج', 'Add at least one product image'));
    if (!form.weight_options.length) return setError(t('أضف خيار بيع واحد على الأقل', 'Add at least one selling option'));
    setSaving(true);

    const cat = categories.find(c => c.id === form.category_id);
    const payload = {
      ...form,
      category_id: form.category_id,
      category_slug: cat?.slug,
      price: Number(form.price),
      sale_price: form.sale_price === '' ? undefined : Number(form.sale_price),
      stock: Number(form.stock),
      sku: form.sku || `SKU-${Date.now()}`,
      name_en: form.name_en || form.name_ar,
      subtitle_ar: form.subtitle_ar || form.name_ar,
      subtitle_en: form.subtitle_en || form.name_en || form.name_ar,
      description_ar: form.description_ar || form.name_ar,
      description_en: form.description_en || form.name_en || form.name_ar,
      origin_country_en: form.origin_country_en || form.origin_country_ar,
      process_en: form.process_en || form.process_ar,
      tasting_notes_ar: String(form.tasting_notes_ar).split('،').map((x: string) => x.trim()).filter(Boolean),
      tasting_notes_en: String(form.tasting_notes_en || form.tasting_notes_ar).split(',').map((x: string) => x.trim()).filter(Boolean),
      images: form.images,
      unit_type: form.unit_type,
      grind_options: form.grind_options || [],
      weight_options: form.weight_options
    };

    try {
      const url = editing ? `/api/admin/products/${editing.id}` : '/api/admin/products';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error_ar || errJson.error || 'Save failed');
      }
      setShow(false);
      await load();
    } catch (err: any) {
      setError(err.message || t('فشل الحفظ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    setDeletingId(deleteConfirmProduct.id);
    try {
      const res = await fetch(`/api/admin/products/${deleteConfirmProduct.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error_ar || errJson.error || 'Delete failed');
      }
      setDeleteConfirmProduct(null);
      await load();
    } catch (err: any) {
      alert(err.message || t('فشل حذف المنتج', 'Failed to delete product'));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(
    () => products.filter(p => `${p.name_ar} ${p.name_en} ${p.sku} ${p.origin_country_ar}`.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(p => p.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size < 1) return;
    setBulkDeleting(true);
    setBulkError('');
    try {
      await bulkDeleteRequest('products', [...selectedIds]);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      await load();
    } catch (err: any) {
      setBulkError(err.message || t('فشل الحذف الجماعي', 'Bulk delete failed'));
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2E30]">{t('إدارة المنتجات', 'Products')}</h1>
          <p className="text-xs text-[#6B8C8E]">{t('كل بيانات المنتج التي تظهر للعميل يتم إدارتها من هنا', 'All customer-visible product data is managed here')}</p>
        </div>
        <button onClick={openAdd} className="bg-[#0E5257] text-white px-5 py-2.5 rounded-xl font-bold flex gap-2 items-center hover:bg-[#2B7D82] transition cursor-pointer">
          <Plus className="w-4 h-4" />
          {t('إضافة منتج', 'Add Product')}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8C8E]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8F2F2] bg-white text-xs text-[#1A2E30]"
          placeholder={t('بحث بالاسم أو SKU...', 'Search by name or SKU...')}
        />
      </div>

      <BulkDeleteBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => setShowBulkConfirm(true)}
        deleting={bulkDeleting}
      />
      {bulkError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{bulkError}</div>}

      <div className="overflow-x-auto rounded-3xl border border-[#E8F2F2] bg-[#F0FAFA]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E8F2F2] text-[#6B8C8E]">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#0E5257] cursor-pointer"
                  title={t('تحديد الكل', 'Select all')}
                />
              </th>
              <th className="p-4 text-start">{t('المنتج / الفئة', 'Product / Category')}</th>
              <th className="p-4 text-start">{t('الوحدة', 'Unit')}</th>
              <th className="p-4 text-start">{t('خيارات الطحن', 'Grinds')}</th>
              <th className="p-4 text-center">{t('السعر', 'Price')}</th>
              <th className="p-4 text-center">{t('المخزون', 'Stock')}</th>
              <th className="p-4 text-end">{t('الإجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#6B8C8E]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0E5257]" />
                  {t('جاري التحميل...', 'Loading...')}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#6B8C8E]">
                  {t('لا توجد منتجات مطابقة', 'No products found')}
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const c = categories.find(x => x.id === p.category_id) || categories.find(x => x.slug === p.category_slug);
                return (
                  <tr key={p.id} className={`border-b border-[#E8F2F2]/60 hover:bg-white/60 transition ${selectedIds.has(p.id) ? 'bg-[#0E5257]/5' : ''}`}>
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 accent-[#0E5257] cursor-pointer"
                      />
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      <div className="relative">
                        <img src={p.images?.[0] || '/placeholder.png'} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <span className="absolute -bottom-1 -right-1 bg-white border border-[#E8F2F2] rounded-full p-1">
                          <ImageIcon className="w-3 h-3 text-[#0E5257]" />
                        </span>
                      </div>
                      <div>
                        <b className="text-[#1A2E30]">{language === 'ar' ? p.name_ar : p.name_en}</b>
                        <div className="text-[10px] text-[#6B8C8E]">{c ? (language === 'ar' ? c.name_ar : c.name_en) : t('بدون فئة', 'Uncategorized')}</div>
                        <div className="text-[10px] text-[#2B7D82] font-mono">{p.sku}</div>
                      </div>
                    </td>
                    <td className="p-4 text-[#1A2E30]">{p.weight_options?.map(o => (language === 'ar' ? o.label_ar : o.label_en)).join(' • ')}</td>
                    <td className="p-4 text-[#6B8C8E]">{p.grind_options?.length ? p.grind_options.join(', ') : '—'}</td>
                    <td className="p-4 font-bold text-center text-[#0E5257]">{formatPrice(p.sale_price ?? p.price)}</td>
                    <td className="p-4 text-center font-semibold text-[#1A2E30]">{p.stock}</td>
                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(p)} className="p-2 bg-[#E8F2F2] text-[#0E5257] hover:bg-[#0E5257] hover:text-white rounded-lg transition cursor-pointer" title={t('تعديل', 'Edit')}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirmProduct(p)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition cursor-pointer" title={t('حذف', 'Delete')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/60" onClick={() => !deletingId && setDeleteConfirmProduct(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 text-[#1A2E30] space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-red-600">{t('تأكيد حذف المنتج', 'Confirm Product Deletion')}</h3>
            <p className="text-xs text-[#6B8C8E]">
              {t(
                `هل أنت متأكد من رغبتك في حذف المنتج "${deleteConfirmProduct.name_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`,
                `Are you sure you want to delete "${deleteConfirmProduct.name_en}"? This action cannot be undone.`
              )}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 rounded-xl bg-[#E8F2F2] text-xs font-bold text-[#1A2E30] hover:bg-[#D0E5E5] transition"
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleDeleteProduct}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition flex items-center gap-2"
              >
                {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('نعم، احذف', 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirm && (
        <BulkDeleteConfirm
          count={selectedIds.size}
          entityLabel={t('منتج', 'products')}
          onCancel={() => !bulkDeleting && setShowBulkConfirm(false)}
          onConfirm={handleBulkDelete}
          confirming={bulkDeleting}
        />
      )}

      {/* Edit/Create Form Modal */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/75" onClick={() => !saving && setShow(false)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-3xl p-6 text-[#1A2E30]">
            <button onClick={() => setShow(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold">{editing ? t('تعديل المنتج', 'Edit Product') : t('إضافة منتج جديد', 'New Product')}</h2>
                <p className="text-xs text-[#6B8C8E]">{t('البيانات هنا هي نفس البيانات التي سيعرضها المتجر للعميل', 'These fields map directly to storefront data')}</p>
              </div>
              {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs">{error}</div>}
              
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-xs font-semibold">{t('الاسم بالعربي', 'Arabic Name')}*<input required value={form.name_ar} onChange={e => update('name_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('الاسم بالإنجليزي', 'English Name')}*<input required value={form.name_en} onChange={e => update('name_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('الفئة', 'Category')}*
                  <select required value={form.category_id} onChange={e => changeCategory(e.target.value)} className="w-full mt-1 p-2 border rounded-xl">
                    <option value="">{t('اختر الفئة', 'Select category')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold">{t('الرابط المختصر', 'Slug')}<input value={form.slug} onChange={e => update('slug', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" placeholder="ethiopia-chelchele" /></label>
                <label className="text-xs font-semibold">{t('السعر الأساسي', 'Base Price')}*<input type="number" min="0" step="0.01" required value={form.price} onChange={e => update('price', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('سعر التخفيض', 'Sale Price')}<input type="number" min="0" step="0.01" value={form.sale_price} onChange={e => update('sale_price', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('المخزون', 'Stock')}*<input type="number" min="0" required value={form.stock} onChange={e => update('stock', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('SKU', 'SKU')}<input value={form.sku} onChange={e => update('sku', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('التقييم', 'Rating')}<input type="number" min="0" max="5" step="0.1" value={form.rating ?? 0} onChange={e => update('rating', Number(e.target.value))} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('عدد التقييمات', 'Review Count')}<input type="number" min="0" value={form.review_count ?? 0} onChange={e => update('review_count', Number(e.target.value))} className="w-full mt-1 p-2 border rounded-xl" /></label>
              </div>

              <ImageGalleryUploader values={form.images} onChange={v => update('images', v)} label={t('صور المنتج', 'Product Gallery')} min={1} />

              {/* Selling Unit & Weight Options */}
              <div className="rounded-2xl border border-[#E8F2F2] p-4 space-y-4">
                <div className="flex items-center gap-2"><Package className="w-4 h-4 text-[#0E5257]" /><b>{t('وحدة البيع والخيارات', 'Selling Unit & Options')}</b></div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="text-xs">{t('نوع القياس', 'Unit Type')}
                    <select value={form.unit_type} onChange={e => changeUnit(e.target.value as ProductUnitType)} className="w-full mt-1 p-2 border rounded-xl">
                      {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{language === 'ar' ? u.ar : u.en}</option>)}
                    </select>
                  </label>
                  <label className="text-xs">{t('اسم الوحدة بالعربي', 'Unit label AR')}<input value={form.unit_label_ar} onChange={e => update('unit_label_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                  <label className="text-xs">{t('اسم الوحدة بالإنجليزي', 'Unit label EN')}<input value={form.unit_label_en} onChange={e => update('unit_label_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                </div>
                {form.weight_options.map((o: ProductWeightOption, i: number) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                    <label className="sm:col-span-1 text-xs">{t('القيمة', 'Value')}<input value={o.value} onChange={e => updateOpt(i, 'value', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" placeholder="250g" /></label>
                    <label className="sm:col-span-1 text-xs">AR<input value={o.label_ar} onChange={e => updateOpt(i, 'label_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                    <label className="sm:col-span-1 text-xs">EN<input value={o.label_en} onChange={e => updateOpt(i, 'label_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                    <label className="text-xs">{t('فرق السعر', 'Price +')}<input type="number" step="0.01" value={o.priceModifier} onChange={e => updateOpt(i, 'priceModifier', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                    <label className="text-xs">{t('Suffix', 'SKU')}<input value={o.skuSuffix} onChange={e => updateOpt(i, 'skuSuffix', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                    <button type="button" onClick={() => removeOpt(i)} disabled={form.weight_options.length === 1} className="p-2 bg-red-50 text-red-500 rounded-lg disabled:opacity-30 hover:bg-red-100 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={addOpt} className="text-xs font-bold text-[#0E5257] hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" />{t('إضافة خيار وزن/حجم آخر', 'Add Option')}</button>
              </div>

              {/* Grind Options Selector */}
              <div className="rounded-2xl border border-[#E8F2F2] p-4 space-y-3">
                <div className="text-xs font-bold text-[#1A2E30]">{t('خيارات الطحن المتاحة لهذا المنتج', 'Available Grind Options')}</div>
                <p className="text-[10px] text-[#6B8C8E]">{t('حدد خيارات الطحن التي يمكن للعميل الاختيار منها عند الشراء', 'Select which grind options the customer can choose at checkout')}</p>
                <div className="flex flex-wrap gap-2">
                  {BREW_OPTIONS.map(opt => {
                    const selected = (form.grind_options || []).includes(opt.value);
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => toggleGrindOption(opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                          selected ? 'bg-[#0E5257] text-white border-[#0E5257]' : 'bg-[#F0FAFA] text-[#1A2E30] border-[#E8F2F2] hover:bg-[#E8F2F2]'
                        }`}
                      >
                        {language === 'ar' ? opt.ar : opt.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!form.is_new} onChange={e => update('is_new', e.target.checked)} />{t('جديد', 'New')}</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!form.is_bestseller} onChange={e => update('is_bestseller', e.target.checked)} />{t('الأكثر مبيعاً', 'Bestseller')}</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!form.is_featured} onChange={e => update('is_featured', e.target.checked)} />{t('مميز', 'Featured')}</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!form.is_roasters_choice} onChange={e => update('is_roasters_choice', e.target.checked)} />{t('اختيار المحمصة', 'Roaster Choice')}</label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-xs font-semibold">{t('العنوان الفرعي بالعربي', 'Subtitle AR')}<input value={form.subtitle_ar} onChange={e => update('subtitle_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('العنوان الفرعي بالإنجليزي', 'Subtitle EN')}<input value={form.subtitle_en} onChange={e => update('subtitle_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('الوصف بالعربي', 'Description AR')}<textarea rows={3} value={form.description_ar} onChange={e => update('description_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs font-semibold">{t('الوصف بالإنجليزي', 'Description EN')}<textarea rows={3} value={form.description_en} onChange={e => update('description_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('بلد المنشأ AR', 'Origin AR')}<input value={form.origin_country_ar} onChange={e => update('origin_country_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('بلد المنشأ EN', 'Origin EN')}<input value={form.origin_country_en} onChange={e => update('origin_country_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('المعالجة AR', 'Process AR')}<input value={form.process_ar} onChange={e => update('process_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('المعالجة EN', 'Process EN')}<input value={form.process_en} onChange={e => update('process_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('المنطقة AR', 'Region AR')}<input value={form.region_ar || ''} onChange={e => update('region_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('المنطقة EN', 'Region EN')}<input value={form.region_en || ''} onChange={e => update('region_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('الارتفاع', 'Altitude')}<input value={form.altitude || ''} onChange={e => update('altitude', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('مستوى التحميص AR', 'Roast Level AR')}<input value={form.roast_level_ar || ''} onChange={e => update('roast_level_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('مستوى التحميص EN', 'Roast Level EN')}<input value={form.roast_level_en || ''} onChange={e => update('roast_level_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('الصنف', 'Variety')}<input value={form.variety || ''} onChange={e => update('variety', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('الإيحاءات AR (بفواصل)', 'Tasting Notes AR')}<input value={form.tasting_notes_ar} onChange={e => update('tasting_notes_ar', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
                <label className="text-xs">{t('الإيحاءات EN (بفواصل)', 'Tasting Notes EN')}<input value={form.tasting_notes_en} onChange={e => update('tasting_notes_en', e.target.value)} className="w-full mt-1 p-2 border rounded-xl" /></label>
              </div>

              <div className="rounded-2xl border border-[#E8F2F2] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black">{t('ملف القهوة للترشيح', 'Coffee Finder Profile')}</div>
                    <p className="text-[10px] text-[#6B8C8E]">{t('هذه البيانات هي التي يعتمد عليها اختبار ترشيح القهوة.', 'These values power Coffee Finder matching.')}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input type="checkbox" checked={form.recommendation_enabled !== false} onChange={e => update('recommendation_enabled', e.target.checked)} />
                    {t('إظهار في نتائج الاختبار', 'Include in Coffee Finder')}
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-xs">{t('درجة التحميص', 'Roast level')}
                    <select value={form.coffee_profile?.roast_level || 'medium'} onChange={e => update('coffee_profile', { ...(form.coffee_profile || emptyCoffeeProfile()), roast_level: e.target.value })} className="w-full mt-1 p-2 border rounded-xl">
                      {ROAST_OPTIONS.map(x => <option key={x.value} value={x.value}>{language === 'ar' ? x.ar : x.en}</option>)}
                    </select>
                  </label>
                  <div>
                    <div className="text-xs font-medium">{t('طرق التحضير المناسبة', 'Suitable brew methods')}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {BREW_OPTIONS.map(x => {
                        const active = (form.coffee_profile?.brew_methods || []).includes(x.value);
                        return (
                          <button
                            type="button"
                            key={x.value}
                            onClick={() => update('coffee_profile', { ...(form.coffee_profile || emptyCoffeeProfile()), brew_methods: active ? (form.coffee_profile.brew_methods || []).filter((v: string) => v !== x.value) : [...(form.coffee_profile?.brew_methods || []), x.value] })}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] border ${active ? 'bg-[#0E5257] text-white border-[#0E5257]' : 'bg-white border-[#E8F2F2]'}`}
                          >
                            {language === 'ar' ? x.ar : x.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['strength', 'القوة', 'Strength'], ['acidity', 'الحموضة', 'Acidity'], ['sweetness', 'الحلاوة', 'Sweetness'], ['body', 'القوام', 'Body'], ['balance', 'التوازن', 'Balance'], ['bitterness', 'المرارة', 'Bitterness'], ['caffeine', 'الكافيين', 'Caffeine']].map(([key, ar, en]) => (
                    <label key={key} className="text-xs">{t(ar, en)}
                      <select value={form.coffee_profile?.[key] || 3} onChange={e => update('coffee_profile', { ...(form.coffee_profile || emptyCoffeeProfile()), [key]: Number(e.target.value) })} className="w-full mt-1 p-2 border rounded-xl">
                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} / 5</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8F2F2] p-4">
                <div className="text-xs font-bold mb-3">{t('بيانات القهوة المتقدمة', 'Advanced Coffee Data')}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['acidity', 'الحموضة', 'Acidity'], ['sweetness', 'الحلاوة', 'Sweetness'], ['body', 'القوام', 'Body'], ['balance', 'التوازن', 'Balance']].map(([key, ar, en]) => (
                    <label key={key} className="text-xs">{t(ar, en)}
                      <input type="number" min="1" max="5" value={form.flavor_profile?.[key] || 1} onChange={e => update('flavor_profile', { ...(form.flavor_profile || {}), [key]: Number(e.target.value) })} className="w-full mt-1 p-2 border rounded-xl" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button disabled={saving} className="flex-1 py-3 bg-[#0E5257] hover:bg-[#2B7D82] text-white rounded-xl font-bold flex justify-center items-center gap-2 cursor-pointer transition">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('حفظ المنتج', 'Save Product')}
                </button>
                <button type="button" onClick={() => setShow(false)} className="px-6 rounded-xl bg-[#E8F2F2] hover:bg-[#D0E5E5] text-xs font-bold transition cursor-pointer">
                  {t('إلغاء', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminProductsManager;
