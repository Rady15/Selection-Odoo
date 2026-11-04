import React, { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Upload, Link, X, Loader2, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
 value: string;
 onChange: (url: string) => void;
 label?: string;
 required?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange, label, required }) => {
 const { t } = useLanguage();
 const fileRef = useRef<HTMLInputElement>(null);
 const [uploading, setUploading] = useState(false);

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setUploading(true);
 try {
 const formData = new FormData();
 formData.append('image', file);
 const res = await fetch('/api/upload', { method: 'POST', body: formData });
 if (!res.ok) throw new Error('Upload failed');
 const data = await res.json();
 onChange(data.url);
 } catch (err) {
 console.error('Upload error:', err);
 alert(t('فشل رفع الصورة', 'Image upload failed'));
 }
 setUploading(false);
 if (fileRef.current) fileRef.current.value = '';
 };

 return (
 <div className="space-y-2">
 {label && (
 <label className="block text-xs font-medium text-[#86A2A4] mb-1">
 {label}
 {required && <span className="text-red-400 ml-1">*</span>}
 </label>
 )}

 {/* Preview */}
 {value && (
 <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#FFFFFF] border border-[#E8F2F2] mb-2">
 <img src={value} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
 <button
 type="button"
 onClick={() => onChange('')}
 className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {!value && (
 <div className="w-full h-32 rounded-xl bg-[#FFFFFF] border border-dashed border-[#E8F2F2] flex items-center justify-center text-[#6B8C8E] mb-2">
 <ImageIcon className="w-8 h-8 opacity-40" />
 </div>
 )}

 {/* Upload buttons row */}
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => fileRef.current?.click()}
 disabled={uploading}
 className="flex-1 bg-[#F0FAFA] hover:bg-[#E8F2F2] border border-[#E8F2F2] text-[#4A6869] py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
 >
 {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
 <span>{uploading ? t('جاري الرفع...', 'Uploading...') : t('رفع صورة', 'Upload Image')}</span>
 </button>
 <span className="text-[#6B8C8E] text-xs self-center">{t('أو', 'OR')}</span>
 <div className="flex-1 relative">
 <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B8C8E]" />
 <input
 type="url"
 value={value}
 onChange={e => onChange(e.target.value)}
 placeholder="https://..."
 className="w-full focus:outline-none focus:border-[#6CC6C9]"
 />
 </div>
 </div>

 <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
 </div>
 );
};

export default ImageUploader;
