import React, { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Link, X, Loader2, Plus, AlertCircle } from 'lucide-react';

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  min?: number;
  /**
   * Public UUID of the product being edited. When present, picked files are
   * written to Odoo immediately. When absent (creating a new product), files
   * are held as data URLs and committed by the parent right after the product
   * is created.
   */
  productId?: string;
}

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

/** Downscale + re-encode in the browser so we never POST multi-megabyte photos. */
async function toOptimisedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not an image');

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // Fallback: read raw and let Odoo handle it.
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(new Error('could not read file'));
      fr.readAsDataURL(file);
    });
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export const ImageGalleryUploader: React.FC<Props> = ({ values, onChange, label, min = 1, productId }) => {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const addUrl = (url: string) => { if (url.trim()) onChange([...values, url.trim()]); };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files ?? []) as File[];
    if (!files.length) return;
    setUploading(true);
    setError('');

    const next = [...values];
    const failures: string[] = [];

    for (const file of files) {
      try {
        const dataUrl = await toOptimisedDataUrl(file);

        if (productId) {
          // Editing an existing product → persist straight away.
          const res = await fetch('/api/product-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, data_base64: dataUrl, filename: file.name }),
          });

          let payload: any = null;
          try { payload = await res.json(); } catch { /* non-JSON error page */ }

          if (!res.ok || !payload?.success) {
            const msg = payload?.error?.message
              || (res.status === 404
                ? t('مسار الرفع غير متاح على هذا النشر', 'Upload route unavailable on this deployment')
                : `HTTP ${res.status}`);
            throw new Error(msg);
          }
          next.push(payload.data.url);
        } else {
          // New product → keep the data URL, parent commits it after create.
          next.push(dataUrl);
        }
      } catch (err: any) {
        failures.push(`${file.name}: ${err?.message || 'failed'}`);
      }
    }

    onChange(next);
    if (failures.length) setError(failures.join(' · '));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const pending = values.filter((v) => v.startsWith('data:')).length;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-[#4A6869]">
          {label}{min > 0 && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {values.map((url, i) => (
          <div key={`${url.slice(0, 32)}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-[#E8F2F2] bg-[#F0FAFA]">
            <img
              src={url}
              alt={`Product ${i + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '.25'; }}
            />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] bg-black/55 text-white rounded py-0.5">
                {t('الصورة الرئيسية', 'Primary')}
              </span>
            )}
            {url.startsWith('data:') && (
              <span className="absolute top-1 left-1 text-[9px] bg-amber-500/90 text-white rounded px-1 py-0.5">
                {t('بالانتظار', 'pending')}
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/65 text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border border-dashed border-[#6CC6C9] bg-[#F0FAFA] text-[#0E5257] flex flex-col items-center justify-center gap-1 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          <span className="text-[10px] font-bold">{t('إضافة صور', 'Add images')}</span>
        </button>
      </div>

      <div className="flex gap-2">
        <input
          id="gallery-url"
          type="url"
          placeholder="https://..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const input = e.currentTarget;
              addUrl(input.value);
              input.value = '';
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById('gallery-url') as HTMLInputElement | null;
            if (input) { addUrl(input.value); input.value = ''; }
          }}
          className="px-3 rounded-xl bg-[#E8F2F2] text-[#0E5257]"
        >
          <Link className="w-4 h-4" />
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />

      {error && (
        <p className="text-[10px] text-red-500 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /><span>{error}</span>
        </p>
      )}

      {!error && pending > 0 && (
        <p className="text-[10px] text-amber-600">
          {t(
            `${pending} صورة ستُرفع بعد حفظ المنتج`,
            `${pending} image(s) will upload once the product is saved`,
          )}
        </p>
      )}

      {values.length < min && (
        <p className="text-[10px] text-red-500">{t('أضف صورة واحدة على الأقل', 'Add at least one image')}</p>
      )}
    </div>
  );
};

export default ImageGalleryUploader;
