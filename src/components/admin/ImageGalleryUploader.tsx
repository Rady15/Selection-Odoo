import React, { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Upload, Link, X, Loader2, ImageIcon, Plus } from 'lucide-react';

interface Props { values: string[]; onChange: (values: string[]) => void; label?: string; min?: number; }

export const ImageGalleryUploader: React.FC<Props> = ({ values, onChange, label, min = 1 }) => {
 const { t } = useLanguage();
 const fileRef = useRef<HTMLInputElement>(null);
 const [uploading, setUploading] = useState(false);
 const addUrl = (url: string) => { if (url.trim()) onChange([...values, url.trim()]); };
 const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
   const files = Array.from(e.target.files || []); if (!files.length) return; setUploading(true);
   try {
     const urls: string[] = [];
     for (const file of files) {
       const fd = new FormData(); fd.append('image', file);
       const res = await fetch('/api/upload', { method:'POST', body:fd });
       if (!res.ok) throw new Error('Upload failed'); const data = await res.json(); urls.push(data.url);
     }
     onChange([...values, ...urls]);
   } catch { alert(t('فشل رفع صورة أو أكثر','One or more images failed to upload')); }
   finally { setUploading(false); if (fileRef.current) fileRef.current.value=''; }
 };
 return <div className="space-y-2">
   {label && <label className="block text-xs font-semibold text-[#4A6869]">{label}{min > 0 && <span className="text-red-500"> *</span>}</label>}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
     {values.map((url,i)=><div key={`${url}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-[#E8F2F2] bg-[#F0FAFA]">
       <img src={url} alt={`Product ${i+1}`} className="w-full h-full object-cover" onError={e=>{(e.currentTarget as HTMLImageElement).style.opacity='.25'}}/>
       {i===0 && <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] bg-black/55 text-white rounded py-0.5">{t('الصورة الرئيسية','Primary')}</span>}
       <button type="button" onClick={()=>onChange(values.filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 p-1 rounded-full bg-black/65 text-white"><X className="w-3 h-3"/></button>
     </div>)}
     <button type="button" onClick={()=>fileRef.current?.click()} disabled={uploading} className="aspect-square rounded-xl border border-dashed border-[#6CC6C9] bg-[#F0FAFA] text-[#0E5257] flex flex-col items-center justify-center gap-1 disabled:opacity-50">
       {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5"/>}<span className="text-[10px] font-bold">{t('إضافة صور','Add images')}</span>
     </button>
   </div>
   <div className="flex gap-2">
     <input id="gallery-url" type="url" placeholder="https://..." className="flex-1" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); const input=e.currentTarget; addUrl(input.value); input.value='';}}}/>
     <button type="button" onClick={()=>{const input=document.getElementById('gallery-url') as HTMLInputElement|null; if(input){addUrl(input.value); input.value='';}}} className="px-3 rounded-xl bg-[#E8F2F2] text-[#0E5257]"><Link className="w-4 h-4"/></button>
   </div>
   <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden"/>
   {values.length < min && <p className="text-[10px] text-red-500">{t('أضف صورة واحدة على الأقل','Add at least one image')}</p>}
 </div>;
};
export default ImageGalleryUploader;
