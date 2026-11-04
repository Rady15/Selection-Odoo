import React,{useEffect,useState} from 'react';
import {useLanguage} from '../context/LanguageContext';
import {Product,QuizQuestion,QuizSettings} from '../types';
import ProductCard from '../components/storefront/ProductCard';
import {Loader2,RotateCcw,CheckCircle2} from 'lucide-react';

interface Props{onNavigate:(path:string)=>void}
type Result=Product & {match_score:number};

export const CoffeeFinderPage:React.FC<Props>=({onNavigate})=>{
 const {language,t}=useLanguage();
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const [questions,setQuestions]=useState<QuizQuestion[]>([]);
 const [settings,setSettings]=useState<QuizSettings|null>(null);
 const [results,setResults]=useState<Result[]>([]);
 const [loading,setLoading]=useState(true);
 const [scoring,setScoring]=useState(false);
useEffect(() => {
    fetch('/api/public/quiz')
      .then(res => res.ok ? res.json() : null)
      .then(quiz => {
        const qs = (quiz?.questions || quiz || []).filter((q: QuizQuestion) => q.is_enabled).sort((a: QuizQuestion, b: QuizQuestion) => a.sort_order - b.sort_order);
        setQuestions(qs);
        setSettings(quiz?.settings || null);
        setStep(qs.length ? 1 : 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectAnswer = async (q: QuizQuestion, optId: string) => {
    const next = { ...answers, [q.id]: optId };
    setAnswers(next);
    const index = questions.findIndex(x => x.id === q.id);
    if (index < questions.length - 1) { setStep(index + 2); return; }
    setScoring(true);
    try {
      const r = await fetch('/api/public/quiz/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: next }) });
      if (!r.ok) throw new Error('Recommendation failed');
      const data = await r.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setStep(questions.length + 1);
    } catch (err) {
      setResults([]);
      setStep(questions.length + 1);
    } finally {
      setScoring(false);
    }
  };
 const reset=()=>{setAnswers({});setResults([]);setStep(questions.length?1:0)};
if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#6CC6C9]" /></div>;
  
  if (questions.length === 0) {
    return (
      <div className="bg-white text-[#1A2E30] min-h-screen py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#E8F2F2] flex items-center justify-center mx-auto text-3xl">☕</div>
          <h2 className="text-2xl font-extrabold text-[#1A2E30]">{t('لا توجد أسئلة للاختبار', 'No quiz questions available')}</h2>
          <p className="text-[#6B8C8E]">{t('يرجى إعداد اختبار القهوة من لوحة الإدارة', 'Please configure the Coffee Finder quiz in admin panel')}</p>
          <button onClick={reset} className="inline-flex bg-[#0E5257] text-white px-6 py-2 rounded-xl text-xs font-bold">{t('إعادة المحاولة', 'Retry')}</button>
        </div>
      </div>
    );
  }

  const current = questions[step - 1];
 return <div className="bg-white text-[#1A2E30] min-h-screen py-12" dir={language==='ar'?'rtl':'ltr'}>
  <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
   <div className="text-center space-y-3">
    {settings?.badge_ar||settings?.badge_en?<span className="inline-flex bg-[#E8F2F2] text-[#0E5257] text-xs font-bold px-3.5 py-1 rounded-full">{language==='ar'?settings?.badge_ar:settings?.badge_en}</span>:null}
    <h1 className="text-3xl sm:text-5xl font-extrabold font-serif">{language==='ar'?settings?.title_ar:settings?.title_en}</h1>
    <p className="text-sm text-[#4A6869] max-w-2xl mx-auto">{language==='ar'?settings?.subtitle_ar:settings?.subtitle_en}</p>
   </div>
   {questions.length>0&&step<=questions.length&&<><div className="flex items-center justify-between max-w-2xl mx-auto text-[10px] sm:text-xs font-bold text-[#6B8C8E] gap-1">{questions.map((q,i)=><span key={q.id} className={step>=i+1?'text-[#0E5257]':''}>{i+1}</span>)}</div><div className="w-full max-w-2xl mx-auto h-2 bg-[#F0FAFA] rounded-full overflow-hidden"><div className="h-full bg-[#6CC6C9] transition-all duration-500" style={{width:`${Math.min(100,(step/questions.length)*100)}%`}}/></div></>}
   {current&&<div className="max-w-3xl mx-auto p-6 sm:p-9 rounded-3xl bg-[#F0FAFA] border border-[#E8F2F2] space-y-7">
    <div className="text-center"><span className="text-[10px] font-bold text-[#6B8C8E]">{t(`السؤال ${step} من ${questions.length}`,`Question ${step} of ${questions.length}`)}</span><h2 className="font-extrabold text-xl sm:text-2xl mt-2">{language==='ar'?current.title_ar:current.title_en}</h2></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{current.options.map(o=><button key={o.id} type="button" onClick={()=>selectAnswer(current,o.id)} className={`p-5 rounded-2xl border bg-white text-start transition hover:-translate-y-0.5 hover:border-[#0E5257] hover:shadow-md flex items-center gap-4 ${answers[current.id]===o.id?'border-[#0E5257] ring-2 ring-[#6CC6C9]/40':''}`}>{o.image_url?<img src={o.image_url} className="w-12 h-12 rounded-xl object-cover" alt=""/>:<span className="text-3xl">{o.icon||'☕'}</span>}<span className="font-bold">{language==='ar'?o.label_ar:o.label_en}</span>{answers[current.id]===o.id&&<CheckCircle2 className="ms-auto w-5 h-5 text-[#0E5257]"/>}</button>)}</div>
    {step>1&&<button onClick={()=>setStep(step-1)} className="text-xs text-[#6B8C8E] hover:underline">← {t('السابق','Back')}</button>}
   </div>}
   {scoring&&<div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#6CC6C9]"/><p className="mt-3 text-sm font-bold">{t('نطابق إجاباتك مع ملفات القهوة...','Matching your answers with coffee profiles...')}</p></div>}
   {step===questions.length+1&&!scoring&&<div className="space-y-7">
    <div className="p-6 rounded-3xl bg-[#F0FAFA] border border-[#6CC6C9]/50 flex flex-col sm:flex-row items-center justify-between gap-4"><div><h3 className="font-extrabold text-xl text-[#0E5257]">🎉 {t('نتيجتك حسب تفضيلاتك','Your matches based on your preferences')}</h3><p className="text-xs text-[#6B8C8E] mt-1">{t('تم ترتيب القهوة من الأعلى تطابقاً إلى الأقل، اعتماداً على بيانات كل منتج في المتجر.','Coffees are ranked by match score using each product profile in the store.')}</p></div><button onClick={reset} className="bg-[#0E5257] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5"/>{t('إعادة الاختبار','Retake')}</button></div>
    {results.length?<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{results.slice(0,settings?.results_count||3).map((prod)=><div key={prod.id} className="relative"><div className="absolute z-10 top-3 end-3 px-2.5 py-1 rounded-full bg-[#0E5257] text-white text-[10px] font-black shadow">{prod.match_score}% {t('تطابق','match')}</div><ProductCard product={prod} onNavigate={onNavigate}/></div>)}</div>:<div className="text-center p-10 rounded-3xl border border-[#E8F2F2]"><p className="font-bold">{t('لا توجد قهوة مهيأة للترشيح حالياً.','No coffees are currently configured for recommendations.')}</p><p className="text-xs text-[#6B8C8E] mt-2">{t('يجب تفعيل «إظهار في نتائج الاختبار» وإكمال ملف القهوة من لوحة الإدارة.','Enable “Include in Coffee Finder” and complete the coffee profile in admin.')}</p></div>}
   </div>}
  </div>
 </div>
};
export default CoffeeFinderPage;
