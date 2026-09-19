import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Trash2, Loader2, X } from 'lucide-react';

interface BulkDeleteBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export const BulkDeleteBar: React.FC<BulkDeleteBarProps> = ({ selectedCount, onClear, onDelete, deleting }) => {
  const { t } = useLanguage();
  if (selectedCount < 1) return null;
  return (
    <div className="sticky top-2 z-20 flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#1A2E30] text-white shadow-2xl animate-fade-in">
      <div className="flex items-center gap-2 text-xs font-bold">
        <span className="bg-[#6CC6C9] text-black font-extrabold px-2.5 py-0.5 rounded-full">{selectedCount}</span>
        <span>{t('عناصر محددة', 'items selected')}</span>
        <button onClick={onClear} className="text-[#6CC6C9] hover:underline cursor-pointer text-[11px]">
          {t('إلغاء التحديد', 'Clear selection')}
        </button>
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
      >
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        {deleting ? t('جاري الحذف...', 'Deleting...') : t('حذف المحدد', 'Delete Selected')}
      </button>
    </div>
  );
};

interface BulkDeleteConfirmProps {
  count: number;
  entityLabel: string;
  skippedMessage?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
}

export const BulkDeleteConfirm: React.FC<BulkDeleteConfirmProps> = ({ count, entityLabel, skippedMessage, onCancel, onConfirm, confirming }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={() => !confirming && onCancel()} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 text-[#1A2E30] space-y-4 shadow-2xl z-50">
        <h3 className="text-lg font-bold text-red-600">{t('تأكيد الحذف الجماعي', 'Confirm Bulk Delete')}</h3>
        <p className="text-xs text-[#6B8C8E]">
          {t(
            `هل أنت متأكد من حذف ${count} من ${entityLabel}؟ لا يمكن التراجع عن هذا الإجراء.`,
            `Are you sure you want to delete ${count} ${entityLabel}? This action cannot be undone.`
          )}
        </p>
        {skippedMessage && (
          <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2.5">{skippedMessage}</p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            disabled={confirming}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-[#E8F2F2] text-xs font-bold text-[#1A2E30] hover:bg-[#D0E5E5] transition cursor-pointer flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition flex items-center gap-2 cursor-pointer"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t('نعم، احذف الكل', 'Yes, Delete All')}
          </button>
        </div>
      </div>
    </div>
  );
}

export async function bulkDeleteRequest(entity: string, ids: string[]): Promise<{ deleted: number; skipped: number; results: any[] }> {
  const res = await fetch('/api/admin/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity, ids })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_ar || err.error_en || 'Bulk delete failed');
  }
  return res.json();
}

export default BulkDeleteBar;
