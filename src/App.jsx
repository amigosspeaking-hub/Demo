import React, { useEffect, useMemo, useState } from 'react';
import { lessonLibrary } from './data/lessons.js';
import { buildListeningItems, transcriptText } from './data/listening.js';
import {
  ArrowLeft, AudioLines, Award, BookOpen, Bookmark, Check, CheckCircle2, ChevronLeft,
  CircleHelp, Clock3, ExternalLink, Flame, Gamepad2, GraduationCap, Headphones, House, Image as ImageIcon, Lightbulb,
  LockKeyhole, Menu, MessageCircle, Mic2, MoreHorizontal, Play, Puzzle, Search, Settings2,
  Sparkles, Star, Target, Trophy, Volume2, X, Zap
} from 'lucide-react';

const levels = [
  { id: 'A1', name: 'بداية المشوار', book: 'Aula internacional Plus 1', tone: 'mint', lessons: 60, progress: 18, unlocked: true, summary: '١٠ وحدات · ٦٠ جلسة حسب برمجة الناشر', topics: [
    { id: 'A1-0', es: 'En el aula', ar: 'في الفصل' },
    { id: 'A1-1', es: 'Nosotros y nosotras', ar: 'إحنا' },
    { id: 'A1-2', es: 'Quiero aprender español', ar: 'عايز أتعلم إسباني' },
    { id: 'A1-3', es: '¿Dónde está Santiago?', ar: 'سانتياغو فين؟' },
    { id: 'A1-4', es: '¿Cuál prefieres?', ar: 'أنهي واحد تفضّل؟' },
    { id: 'A1-5', es: 'Tus amigos son mis amigos', ar: 'أصحابك أصحابي' },
    { id: 'A1-6', es: 'Día a día', ar: 'كل يوم' },
    { id: 'A1-7', es: '¡A comer!', ar: 'يلا ناكل!' },
    { id: 'A1-8', es: 'El barrio ideal', ar: 'الحيّ المثالي' },
    { id: 'A1-9', es: '¿Sabes conducir?', ar: 'بتعرف تسوق؟' },
  ] },
  { id: 'A2', name: 'اتكلم براحتك', book: 'Aula internacional Plus 2', tone: 'peach', lessons: 12, progress: 0, unlocked: true, summary: '١٠ وحدات من مواد Drive · ٣ مراحل · ١٢ لقاء', topics: [
    { id: 'A2-1', es: 'El español y tú', ar: 'الإسباني وإنت' },
    { id: 'A2-2', es: 'Una vida de película', ar: 'حياة زي الأفلام' },
    { id: 'A2-3', es: 'Yo soy así', ar: 'أنا كده' },
    { id: 'A2-4', es: 'Hogar, dulce hogar', ar: 'البيت بيتك' },
    { id: 'A2-5', es: '¿Cómo va todo?', ar: 'أخبارك إيه؟' },
    { id: 'A2-6', es: 'Guía del ocio', ar: 'دليل وقت الفراغ' },
    { id: 'A2-7', es: '¿Comes de todo?', ar: 'بتاكل كل حاجة؟' },
    { id: 'A2-8', es: 'Estamos muy bien', ar: 'إحنا كويسين' },
    { id: 'A2-9', es: 'Antes y ahora', ar: 'زمان ودلوقتي' },
    { id: 'A2-10', es: 'Momentos especiales', ar: 'لحظات مميزة' },
  ] },
  { id: 'B1', name: 'خطوة للاستقلال', book: 'Aula internacional Plus 3', tone: 'lilac', lessons: 36, progress: 0, unlocked: false, summary: 'عبّر عن رأيك واحكي تجاربك', topics: ['احكي عن تجاربك', 'الخطط والاحتمالات', 'الأخبار والإعلام', 'العمل والدراسة'] },
  { id: 'B2.1', name: 'طلاقة وثقة · ١', book: 'Aula internacional Plus 4', tone: 'yellow', lessons: 40, progress: 0, unlocked: false, summary: 'وسّعي قدرتك على النقاش والتعبير', topics: ['عرض الرأي والحجج', 'فهم نصوص أطول', 'تعبيرات أدق', 'تواصل في مواقف متنوعة'] },
  { id: 'B2.2', name: 'طلاقة وثقة · ٢', book: 'Aula internacional Plus 5', tone: 'yellow', lessons: 40, progress: 0, unlocked: false, summary: 'ثبّتي B2 واستعدّي للمستوى المتقدم', topics: ['النقاش والإقناع', 'الفروق الدقيقة', 'اللغة المهنية', 'التعبيرات الاصطلاحية'] },
  { id: 'C1', name: 'إسباني متقدم', book: 'Aula C1', tone: 'blue', lessons: 44, progress: 0, unlocked: false, summary: 'فهم عميق وتعبير مرن ودقيق', topics: ['الأسلوب والسياق', 'نصوص أكاديمية', 'البلاغة والتلميح', 'التعبير المتقدم'] },
];

const a1DriveStages = [
  { id: 'A1.1', units: 'الوحدات ٠–٣', startIndex: 0, folderHref: 'https://drive.google.com/drive/folders/1wjyqVGSKBbigy4OAeojjRb5APHvLk3nf', files: [
    { label: 'ملف HTML الأحدث · v53 (Drive)', href: 'https://drive.google.com/file/d/1R04whF84_wkSO8mmpIzh74l4MDdvWvIz/view?usp=drivesdk' },
    { label: 'الحزمة الكاملة الأحدث · v53 ZIP', href: 'https://drive.google.com/file/d/1DULmThyiEWdnTd29_j2v2IAo3VSzgqJd/view?usp=drivesdk' },
  ] },
  { id: 'A1.2', units: 'الوحدات ٤–٦', startIndex: 4, folderHref: 'https://drive.google.com/drive/folders/1KFDPO1fZrNB9StYbhT36Bm0KhYOnyUkS', files: [
    { label: 'ملف الدروس — جزء ١', href: 'https://drive.google.com/file/d/1qljUnx5sexbUd1XhTekFCMUxdI6WNNrx/view?usp=drivesdk' },
    { label: 'ملف الدروس — جزء ٢', href: 'https://drive.google.com/file/d/1U7xnHXortUetLud0-CJHImKQGNdsvf_i/view?usp=drivesdk' },
  ] },
  { id: 'A1.3', units: 'الوحدات ٧–٩', startIndex: 7, folderHref: 'https://drive.google.com/drive/folders/1VkdgdOJmylzinlOCz2s1NBpsQYH37iDh', files: [] },
];

const a2Stages = [
  { id: 'A2.1', meetings: 'اللقاءات ١–٤', units: 'الوحدات ١–٤', focus: 'العادات، التعارف، وصف الأشخاص والبيت', grammar: 'المضارع، الأفعال الانعكاسية، الماضي البسيط، وصف الصفات والمقارنة', check: 'مراجعة قصيرة في نهاية المرحلة', resources: [
    { label: 'أحدث حزمة كاملة · v190 ZIP (Drive)', href: 'https://drive.google.com/file/d/1OnFlx8Z4lNgvck1oED6EA-SqY1Jq4WcY/view?usp=drivesdk', primary: true },
  ] },
  { id: 'A2.2', meetings: 'اللقاءات ٥–٨', units: 'الوحدات ٥–٨', focus: 'التواصل اليومي، وقت الفراغ، الطعام والصحة', grammar: 'المضارع المستمر، الماضي القريب، مفعول به مباشر، وصيغة الأمر', check: 'مراجعة قصيرة في نهاية المرحلة' },
  { id: 'A2.3', meetings: 'اللقاءات ٩–١٢', units: 'الوحدتان ٩–١٠ + مراجعة', focus: 'حكي الذكريات واللحظات المهمة ومقارنة زمان بدلوقتي', grammar: 'الماضي الناقص والبسيط والفرق بينهم في الحكي', check: 'مراجعة شاملة ومحاكاة DELE A2' },
];

const navItems = [
  { id: 'home', label: 'الرئيسية', icon: House },
  { id: 'path', label: 'رحلتي', icon: GraduationCap },
  { id: 'listening', label: 'استمع وترجم', icon: Headphones },
  { id: 'games', label: 'العب واتعلم', icon: Gamepad2 },
  { id: 'words', label: 'كلماتي', icon: Bookmark },
  { id: 'progress', label: 'إنجازاتي', icon: Trophy },
];

const programPlanItems = [
  { icon: MessageCircle, title: 'تعليم وشرح بالمصري', text: 'الشرح والتعليمات والتغذية الراجعة بالعربي المصري، مع أمثلة إسبانية أصلية وواضحة.' },
  { icon: ImageIcon, title: 'صور تعليمية أصلية', text: 'رسوم وصور للمفردات والمواقف: الفصل، البيت، الحي، الأكل والصحة، من غير نسخ صفحات الكتاب.' },
  { icon: Gamepad2, title: 'ألعاب تثبّت التعلّم', text: 'مطابقة كلمات، استماع واختيار، بطاقات مراجعة وتحديات قصيرة مرتبطة بالوحدة.' },
  { icon: BookOpen, title: 'قواعد خطوة بخطوة', text: 'قاعدة بالمصري، مثال في سياق، تدريب متدرّج، وبعده استخدام عملي للغة.' },
  { icon: Volume2, title: 'نطق إسباني مولّد', text: 'تشغيل نطق إسباني آلي من المتصفح؛ مش تسجيلات الكتاب، مع مراعاة الصوت المتاح على الجهاز.' },
  { icon: Target, title: 'محتوى شامل ودقيق', text: 'أهداف ومفردات وقواعد واستماع ونطق ومحادثة وقراءة وكتابة وتقييم لكل مرحلة، ومراجعة مقابل الطبعة والمصدر.' },
];

function readSaved() {
  try { return JSON.parse(localStorage.getItem('hola-progress') || '{}'); } catch { return {}; }
}

function speakSpanish(text) {
  if (!('speechSynthesis' in window)) return false;
  const speech = window.speechSynthesis;
  const spanishVoices = speech.getVoices().filter(voice => voice.lang?.toLowerCase().startsWith('es'));
  const voice = spanishVoices.find(item => item.lang.toLowerCase() === 'es-es')
    || spanishVoices.find(item => item.lang.toLowerCase() === 'es-mx')
    || spanishVoices.find(item => item.lang.toLowerCase().startsWith('es-419'))
    || spanishVoices[0];
  speech.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang || 'es-ES';
  utterance.rate = 0.86;
  utterance.pitch = 1;
  if (voice) utterance.voice = voice;
  speech.speak(utterance);
  return true;
}

function HolaArt() {
  return <svg className="hero-art" viewBox="0 0 340 240" role="img" aria-label="رسم ملوّن لشارع إسباني وشمس مشرقة">
    <circle cx="259" cy="52" r="29" fill="#FFD778" />
    <path d="M0 153 Q54 113 109 148T220 141T340 123V240H0Z" fill="#F7B89B" />
    <path d="M0 182 Q82 145 153 179T340 160V240H0Z" fill="#F19A7D" />
    <rect x="26" y="90" width="105" height="124" rx="5" fill="#F8E7CC" />
    <path d="M18 93 77 49l62 44Z" fill="#D8775B" />
    <rect x="41" y="110" width="24" height="34" rx="12" fill="#8EB9A4" />
    <rect x="91" y="110" width="24" height="34" rx="12" fill="#8EB9A4" />
    <rect x="68" y="163" width="23" height="51" rx="11" fill="#B77759" />
    <rect x="191" y="112" width="98" height="102" rx="5" fill="#F6D6A7" />
    <path d="M181 115 240 72l59 43Z" fill="#E78B69" />
    <rect x="207" y="132" width="23" height="31" rx="11" fill="#8EB9A4" />
    <rect x="251" y="132" width="23" height="31" rx="11" fill="#8EB9A4" />
    <rect x="233" y="170" width="18" height="44" rx="9" fill="#B77759" />
    <path d="M0 212h340" stroke="#C97760" strokeWidth="5" />
    <path d="M146 216 165 216l-9-34Z" fill="#F8F0DD" />
    <circle cx="155" cy="174" r="10" fill="#446C59" /><path d="M155 184v28m0-19-12 9m12-7 12 7" stroke="#3C5A4D" strokeWidth="5" strokeLinecap="round" />
    <circle cx="318" cy="157" r="12" fill="#4F755F" /><path d="M318 169v44m0-26-14 12m14-8 13 12" stroke="#3E5E4B" strokeWidth="5" strokeLinecap="round" />
    <path d="M280 50c10-12 21-8 25 2-11 5-19 5-25-2Z" fill="#7DAF8E" />
    <path d="M289 56c-7-11-2-20 9-22 2 12 0 19-9 22Z" fill="#92BE91" />
    <path d="M165 92c8-11 19-8 23 2-9 5-17 4-23-2Z" fill="#7DAF8E" />
  </svg>;
}

function Sidebar({ active, onNavigate, streak }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><span>¡</span></div><div><b>Hola<span className="brand-dot">.</span></b><small>الإسباني بالمصري</small></div></div>
    <div className="side-label">القائمة</div>
    <nav className="side-nav" aria-label="التنقل الرئيسي">
      {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${active === id ? 'active' : ''}`} onClick={() => onNavigate(id)}><Icon size={19} strokeWidth={2.1}/><span>{label}</span>{id === 'games' && <span className="nav-new">جديد</span>}</button>)}
    </nav>
    <div className="side-spacer" />
    <div className="side-streak"><div className="streak-icon"><Flame size={21} fill="currentColor" /></div><div><b>{streak} أيام ورا بعض!</b><span>حافظ على الستريك بتاعك</span></div></div>
    <button className="profile-mini"><div className="avatar">م</div><div className="profile-copy"><b>مريم أحمد</b><span>مستوى A1 · مبتدئة</span></div><MoreHorizontal size={19} /></button>
  </aside>;
}

function Header({ active, onSearch }) {
  const titles = { home: 'أهلاً يا مريم 👋', path: 'رحلتك في الإسباني', listening: 'استمعي واقرئي الترجمة', games: 'وقت اللعب والتعلّم', words: 'دفتر الكلمات', progress: 'إنجازاتك الحلوة' };
  const subtitles = {
    home: 'جاهزة نكمّل الإسباني سوا؟',
    listening: 'النص والترجمة من أمثلة الدروس المحلية.',
  };
  return <header className="topbar">
    <div className="mobile-brand"><div className="brand-mark"><span>¡</span></div><b>Hola<span className="brand-dot">.</span></b></div>
    <div className="page-heading"><h1>{titles[active]}</h1><p>{subtitles[active] || 'كل يوم خطوة صغيرة تقرّبك من الطلاقة.'}</p></div>
    <div className="top-actions"><button className="icon-button search-button" aria-label="بحث" onClick={onSearch}><Search size={19}/></button><button className="streak-chip"><Flame size={17} fill="currentColor"/> ٥ <span>أيام</span></button><button className="avatar top-avatar" aria-label="الملف الشخصي">م</button></div>
  </header>;
}

function LevelPill({ level = 'A1' }) { return <span className={`level-pill level-${level.toLowerCase().replaceAll('.', '-')}`}>{level}</span>; }

function HomePage({ onOpenLesson, onNavigate, xp, doneLessons, savedWords, onSaveWord }) {
  const [answer, setAnswer] = useState(null);
  const quizCorrect = answer === 1;
  return <>
    <section className="hero-card">
      <div className="hero-copy"><div className="eyebrow"><Sparkles size={15}/> درس النهارده مستنيكي</div><h2>يلا نكمّل رحلتك<br/>ونقول <span>¡Hola!</span></h2><p>خطوة بسيطة كل يوم، وإسبانيك هيبقى أحسن بكتير. مستعدة؟</p><button className="primary-button" onClick={onOpenLesson}><Play size={17} fill="currentColor"/> كمّلي الدرس <ArrowLeft size={17}/></button><div className="hero-note"><CheckCircle2 size={15}/> درس قصير · حوالي ٥ دقايق</div></div>
      <div className="hero-visual"><div className="sun-sticker">¡Hola!</div><HolaArt/><div className="bubble-sticker">¡Qué bonito! <span>💛</span></div></div>
      <div className="hero-side-note"><span className="note-dot"/> <b>كل كلمة جديدة</b><small>بتقرّبك من هدفك</small></div>
    </section>

    <section className="stats-row" aria-label="ملخص التقدم">
      <div className="stat-card"><span className="stat-icon stat-orange"><Flame size={19} fill="currentColor"/></span><div><b>٥ أيام</b><small>الستريك الحالي</small></div><span className="stat-trend">ممتاز!</span></div>
      <div className="stat-card"><span className="stat-icon stat-yellow"><Zap size={18} fill="currentColor"/></span><div><b>{xp} نقطة</b><small>مجموع الـ XP</small></div><span className="stat-trend">+١٢ اليوم</span></div>
      <div className="stat-card"><span className="stat-icon stat-green"><Target size={18}/></span><div><b>١٢ / ١٥ دقيقة</b><small>هدفك اليومي</small></div><div className="mini-progress"><i style={{width:'80%'}}/></div></div>
    </section>

    <section className="content-grid">
      <div className="main-column">
        <div className="section-head"><div><h2>رحلتك التعليمية</h2><p>كل مستوى محطة جديدة في مشوارك</p></div><button className="text-link" onClick={() => onNavigate('path')}>شوفي الخطة كاملة <ChevronLeft size={16}/></button></div>
        <div className="level-list">
          {levels.map((level, index) => <button key={level.id} className={`level-card ${level.tone} ${!level.unlocked ? 'locked' : ''}`} onClick={() => level.unlocked ? onNavigate('path') : null}>
            <div className="level-badge">{level.unlocked ? <span>{level.id}</span> : <LockKeyhole size={17}/>}</div>
            <div className="level-info"><div className="level-title-row"><b>{level.name}</b><LevelPill level={level.id}/></div><span>{level.summary}</span><div className="level-progress-row"><div className="progress-track"><i style={{width:`${level.progress}%`}}/></div><small>{level.progress ? `${level.progress}%` : 'مقفول'}</small></div></div>
            <span className="level-chevron"><ChevronLeft size={19}/></span>
          </button>)}
        </div>

        <div className="section-head vocab-head"><div><h2>كلمة النهارده <span className="tiny-spark">✳</span></h2><p>كلمة صغيرة… هتفرق في كلامك</p></div><button className="icon-button save-button" aria-label="حفظ الكلمة" onClick={() => onSaveWord('despacio')}><Bookmark size={18} fill={savedWords.includes('despacio') ? 'currentColor' : 'none'}/></button></div>
        <div className="word-feature"><div className="word-art"><span className="word-sun"/><div className="word-cup">☕</div><span className="word-spark">✦</span></div><div className="word-copy"><span className="word-label">ظرف · A1</span><h3>despacio</h3><p className="word-pron">ديسپاسيو <button onClick={() => speakSpanish('despacio')} aria-label="اسمع نطق despacio"><Volume2 size={16}/></button></p><div className="word-meaning">بالبطيء / على مهلك <span>🐢</span></div><small>Habla despacio, por favor. <em>اتكلم بالراحة، لو سمحت.</em></small></div></div>
      </div>

      <div className="right-column">
        <div className="daily-card"><div className="daily-top"><div><span className="daily-label"><Lightbulb size={15}/> تحدّي سريع</span><h3>اختاري الإجابة الصح</h3></div><span className="daily-illustration">✏️</span></div><div className="quiz-question"><span>يعني إيه <b>gracias</b>؟</span><button onClick={() => speakSpanish('gracias')} className="sound-small" aria-label="استمع"><Volume2 size={16}/></button></div><div className="quiz-options">{['من فضلك', 'شكراً', 'صباح الخير'].map((option, i) => <button key={option} className={`quiz-option ${answer === i ? (i === 1 ? 'correct' : 'wrong') : ''} ${answer !== null && i === 1 ? 'show-correct' : ''}`} onClick={() => setAnswer(i)}><span className="option-letter">{['أ','ب','ج'][i]}</span>{option}{answer === i && (i === 1 ? <Check size={17}/> : <X size={17}/>)}</button>)}</div>{answer !== null && <div className={`quiz-feedback ${quizCorrect ? 'good' : 'try-again'}`}>{quizCorrect ? 'بالظبط! ¡Muy bien! 🎉' : 'قريبة! الإجابة الصح هي «شكراً»'}</div>}<div className="daily-footer"><span><Clock3 size={14}/> أقل من دقيقة</span><span>+١٠ XP</span></div></div>
        <div className="grammar-card"><div className="grammar-head"><span className="grammar-icon"><BookOpen size={18}/></span><span className="grammar-tag">جرامر على السريع</span><button className="dots-button" aria-label="المزيد"><MoreHorizontal size={18}/></button></div><h3>ser ولا estar؟</h3><p>الاتنين معناهم «يكون»، بس كل واحدة ليها استخدام مختلف!</p><div className="grammar-example"><span><b>Ser</b> = حاجة ثابتة</span><span className="example-es">Soy egipcia. <small>أنا مصرية.</small></span></div><div className="grammar-example"><span><b>Estar</b> = حالة مؤقتة</span><span className="example-es">Estoy feliz. <small>أنا مبسوطة.</small></span></div><button className="grammar-link" onClick={onOpenLesson}>افهمي القاعدة أكتر <ArrowLeft size={15}/></button></div>
        <div className="weekly-card"><div className="weekly-head"><span>تقدّم الأسبوع</span><MoreHorizontal size={17}/></div><div className="weekly-chart">{[{d:'س',h:42},{d:'ح',h:70},{d:'ن',h:56},{d:'ث',h:88},{d:'ر',h:50},{d:'خ',h:100},{d:'ج',h:24}].map((x,i)=><div className="bar-column" key={i}><div className={`week-bar ${i===5?'today':''}`} style={{height:`${x.h}%`}}/ ><small>{x.d}</small></div>)}</div><div className="weekly-foot"><span><span className="chart-dot"/> دقايق تعلّم</span><b>٤٢ دقيقة <span>↗</span></b></div></div>
      </div>
    </section>
  </>;
}

function PathPage({ onOpenLesson, onStartA1Course }) {
  return <div className="path-page">
    <div className="path-intro">
      <div><span className="eyebrow"><GraduationCap size={15}/> المنهج من A1 لـ C1</span><h2>خريطة طريقك للطلاقة</h2><p>ترتيب المستويات ماشي مع كتب Aula internacional Plus، وبعد B2 نكمّل بكتاب Aula C1.</p></div>
      <div className="path-sticker">🗺️</div>
    </div>
    <div className="path-levels">
      {levels.map((l, i) => <section className={`path-level ${l.tone}`} key={l.id}>
        <div className="path-level-head">
          <span className="path-level-number">{i + 1}</span>
          <div><LevelPill level={l.id}/><h3>{l.name}</h3><p>{l.summary}</p></div>
          <span className="path-hours">{l.book}</span>
        </div>
        <div className={`path-topics ${l.id === 'A2' ? 'a2-topics' : ''}`}>
          {l.topics.map((topic, j) => {
            const isStructuredUnit = typeof topic === 'object';
            const topicKey = isStructuredUnit ? topic.es : topic;
            const lessonAvailable = (l.id === 'A1' || l.id === 'A2') && Boolean(lessonLibrary[topic.id]);
            const isLocked = !l.unlocked || !lessonAvailable;
            return <button key={topicKey} onClick={() => lessonAvailable && l.unlocked && onOpenLesson(l.id, topic.id)} disabled={isLocked} className={`${isLocked ? 'topic-locked' : ''} ${isStructuredUnit ? 'book-unit' : ''}`}>
              <span className="topic-check">{l.progress > j * 6 ? <Check size={14}/> : isLocked ? <LockKeyhole size={13}/> : <Play size={12} fill="currentColor"/>}</span>
              {isStructuredUnit ? <span className="unit-topic"><b lang="es">{topic.es}</b><small>{topic.ar}</small></span> : <span>{topic}</span>}
              {isLocked ? <small className="unit-coming">قريباً</small> : <ChevronLeft size={16}/>}
            </button>;
          })}
        </div>
        {l.id === 'A1' && <>
          <p className="a1-source-note"><Lightbulb size={14}/> عناوين A1 راجعناها على الكتاب والبرنامج المنشور؛ مجلد Drive الأول فيه مواد المدرّس التفصيلية المتاحة للوحدات U0–U5. الشروح والأنشطة في التطبيق أصلية. <a href="https://drive.google.com/drive/folders/1RlWgPNBoAXuQ1cPbfKhQ855gpyAEzZ56" target="_blank" rel="noreferrer">مصدر الكتاب</a></p>
          <div className="a1-course-mode-start"><div><b>كورس A1 · الترتيب العادي</b><small>ابدئي من الوحدة ٠؛ كمّلي الدروس بالترتيب لحد الوحدة ٩.</small></div><button className="primary-button" onClick={() => onStartA1Course(0)}><Play size={14} fill="currentColor"/> ابدئي الكورس</button></div>
          <div className="a1-drive-stages" aria-label="تقسيم كورس A1 وملفات المحاضرات">
            {a1DriveStages.map((stage) => <article className="a1-drive-stage" key={stage.id}>
              <div className="a1-stage-heading"><span className="level-pill">{stage.id}</span><b>{stage.units}</b></div>
              <button className="a1-stage-start" onClick={() => onStartA1Course(stage.startIndex)}>ابدئي {stage.id} بالترتيب <ChevronLeft size={14}/></button>
              <div className="a1-drive-file-links">{stage.files.length ? stage.files.map((file) => <a key={file.href} href={file.href} target="_blank" rel="noreferrer"><ExternalLink size={12}/>{file.label}</a>) : <small className="a1-drive-pending">مجلد ملفات A1.3 فاضي حاليًا؛ وحداته موجودة في كورس التطبيق.</small>}</div>
              {stage.id === 'A1.1' && <small className="a1-drive-pending">معاينة Drive لملف HTML لا تضمن تحميل الصور والخطوط والصوت النسبي؛ التشغيل الكامل يتطلب الحزمة مع مجلداتها.</small>}
              {stage.folderHref && <a className="a1-folder-link" href={stage.folderHref} target="_blank" rel="noreferrer">افتحي مجلد {stage.id} على Drive</a>}
            </article>)}
          </div>
        </>}
        {l.id === 'A2' && <><p className="a1-source-note"><Lightbulb size={14}/> خريطة A2 من نسخة الكتاب ذات ١٠ وحدات في مجلد Drive؛ راجعنا أسماءها في تدقيق الكتاب، والخطة الأصلية في نفس المجلد هي اللي بتحدد التقسيم والتدريس. <a href="https://drive.google.com/drive/folders/1XLqKXRRO491-Wjxiff7BtqbAwB6BGpUe" target="_blank" rel="noreferrer">افتحي مجلد المصدر</a></p><div className="a2-course-plan">
          <div className="a2-course-heading"><div><span className="a2-plan-label"><BookOpen size={14}/> خطة A2 من مجلدك</span><b>١٢ لقاء × ٣ ساعات = ٣٦ ساعة</b></div><span className="a2-plan-icon">🗓️</span></div>
          <div className="a2-plan-metrics" aria-label="مخرجات مخططة في ملف المرجع"><span><b>١٠</b> وحدات</span><span><b>٧٢</b> مهمة قصيرة بالخطة</span><span><b>٧٢</b> رسالة مساندة بالخطة</span></div>
          <div className="a2-stage-list">{a2Stages.map((stage, idx) => <article className="a2-stage" key={stage.id}>
            <div className="a2-stage-top"><LevelPill level={stage.id}/><span>{stage.meetings}</span><b>{stage.units}</b></div>
            <p>{stage.focus}</p><div className="a2-grammar"><BookOpen size={13}/><span><b>جرامر:</b> {stage.grammar}</span></div>
            <small className="a2-checkpoint"><CheckCircle2 size={13}/>{stage.check}</small>
            {stage.resources && <>
              <div className="a2-drive-resources" aria-label="ملفات A2.1 على Google Drive">
                {stage.resources.map((resource) => <a key={resource.label} className={resource.primary ? 'a2-drive-resource primary' : 'a2-drive-resource'} href={resource.href} target="_blank" rel="noreferrer"><ExternalLink size={12}/>{resource.label}</a>)}
              </div>
              <small className="a2-resource-note">ده رابط الحزمة الأصلية، مش تشغيل HTML محلي؛ ملفات الصور والصوت والخطوط لازم تفضل بجوار الصفحة بعد فك الضغط.</small>
            </>}
            {idx === 0 && <button className="a2-preview-button" onClick={() => onOpenLesson('A2')}>جربي نموذج درس A2.1 <ArrowLeft size={14}/></button>}
          </article>)}</div>
          <p className="a2-plan-foot"><Lightbulb size={14}/> ملفك بيربط الوحدات العشر بمستويات A2.1–A2.3 على ١٢ لقاء، وده أساس الخطة هنا. مواد Drive تشير كمان لمسارات استماع؛ التطبيق هيستخدم نطقًا إسبانيًا مولّدًا، مش تسجيلات الكتاب، والأنشطة بالعربي المصري أصلية.</p>
        </div></>}
        <div className="path-level-foot"><div className="progress-track"><i style={{width:`${l.progress}%`}}/></div><small>{l.progress ? `${l.progress}% مكتمل` : l.unlocked ? 'ابدئي أول درس' : 'كمّلي المستوى اللي قبله عشان تفتحيه'}</small></div>
      </section>)}
    </div>
    <ProgramPlan />
    <div className="curriculum-note"><Lightbulb size={18}/><span><b>طريقة الوحدة:</b> نلاحظ اللغة في سياق، نتمرّن على الجرامر والمفردات، وبعدين نستخدم اللي اتعلمناه في مهمة تواصلية، مع استماع ونطق وثقافة. المحتوى والأنشطة بالمصري وبصياغة أصلية.</span></div>
  </div>;
}

function ProgramPlan() {
  return <section className="program-plan" aria-labelledby="program-plan-title">
    <div className="program-plan-heading">
      <span className="eyebrow"><Sparkles size={15}/> خطة البرنامج التعليمية</span>
      <h2 id="program-plan-title">إسباني شامل، بالمصري، وبطريقة ممتعة</h2>
      <p>الأولوية دلوقتي لاستكمال A1 وA2، مع الحفاظ على خريطة التعلّم الأوسع لحد C1.</p>
    </div>
    <div className="program-plan-grid">
      {programPlanItems.map(({ icon: Icon, title, text }) => <article className="program-plan-card" key={title}>
        <span className="program-plan-icon"><Icon size={19}/></span>
        <div><h3>{title}</h3><p>{text}</p></div>
      </article>)}
    </div>
    <aside className="assistant-capabilities">
      <div className="assistant-capability-icon"><Sparkles size={19}/></div>
      <div className="assistant-capability-copy">
        <h3>إزاي المساعد يقدر يساعد في إنشاء البرنامج؟</h3>
        <p>أقدر أرتّب المنهج حسب المصدر والطبعة، وأكتب شرح وتمارين أصلية بالمصري، وأجهّز أفكار صور وألعاب وصوت إسباني مولّد، وأراجع دقة القواعد وتدرّج الدروس وأصلّحها معاك خطوة بخطوة.</p>
        <small>هنفصل دايمًا بين فهرس الكتاب وخطة التدريس، ومش هنعيد نشر مواده المحمية.</small>
      </div>
    </aside>
  </section>;
}

function GamesPage({ addXp }) {
  const pairs = [{es:'casa',ar:'بيت'},{es:'agua',ar:'مياه'},{es:'libro',ar:'كتاب'}];
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  const [feedback, setFeedback] = useState('اختاري كلمة إسباني وبعدها معناها بالعربي.');
  const [rightOrder] = useState(() => [...pairs].sort(() => Math.random() - .5));
  function chooseEs(word) { if (matched.includes(word)) return; setSelected(word); setFeedback('اختاري معناها بالمصري 👇'); }
  function chooseAr(pair) {
    if (!selected) { setFeedback('ابدئي باختيار الكلمة الإسباني الأول!'); return; }
    if (pairs.find(x => x.es === selected)?.ar === pair.ar) {
      const next = [...matched, selected]; setMatched(next); setSelected(null); setFeedback(next.length === pairs.length ? 'عاش! كسبتي الجولة 🎉' : 'صح عليكي! كمّلي ✨');
      if (next.length === pairs.length) addXp(15);
    } else { setFeedback('مش دي، جرّبي تاني 💪'); }
  }
  return <div className="games-page"><div className="games-banner"><div><span className="eyebrow"><Gamepad2 size={15}/> العب واتعلّم</span><h2>اللعب كمان مذاكرة! 🎲</h2><p>تمارين سريعة تثبّت الكلمات في دماغك.</p></div><div className="game-emoji">🧩</div></div><div className="game-layout"><section className="match-game"><div className="game-title-row"><div><span className="game-kicker">لعبة ٠١ · مفردات</span><h3>وصّلي الكلمة بمعناها</h3></div><span className="game-timer"><Clock3 size={15}/> بدون ضغط</span></div><p className="game-instructions">اختاري كلمة بالإسباني، وبعدها دوسي على معناها.</p><div className="match-columns"><div>{pairs.map(p=><div key={p.es} className={`match-card ${selected===p.es?'selected':''} ${matched.includes(p.es)?'matched':''}`}><button className="match-choice" onClick={()=>chooseEs(p.es)} disabled={matched.includes(p.es)}>{p.es}</button><button className="nested-sound" aria-label={`اسمع ${p.es}`} onClick={()=>speakSpanish(p.es)}><Volume2 size={16}/></button></div>)}</div><div>{rightOrder.map(p=><button key={p.ar} className={`match-card arabic-match ${matched.some(word=>pairs.find(x=>x.es===word)?.ar===p.ar)?'matched':''}`} onClick={()=>chooseAr(p)} disabled={matched.some(word=>pairs.find(x=>x.es===word)?.ar===p.ar)}><span>{p.ar}</span><span className="match-circle">{matched.some(word=>pairs.find(x=>x.es===word)?.ar===p.ar)?<Check size={15}/>:''}</span></button>)}</div></div><div className={`game-feedback ${matched.length===pairs.length?'game-win':''}`}>{matched.length===pairs.length?<Trophy size={17}/>:<Sparkles size={16}/>} {feedback}</div><div className="game-foot"><span>{matched.length} من {pairs.length} أزواج</span><button onClick={()=>{setMatched([]);setSelected(null);setFeedback('جولة جديدة! ابدئي بالكلمة الإسباني.');}}>ابدئي من جديد <ArrowLeft size={14}/></button></div></section><div className="game-side"><div className="game-side-card"><div className="side-game-icon">🧠</div><h3>فلاش كاردز</h3><p>راجعي كلماتك القديمة بطريقة سريعة.</p><button onClick={()=>setFeedback('قريباً: فلاش كاردز بتتغير حسب الكلمات اللي محتاجة مراجعة.')}>ابدئي المراجعة <ArrowLeft size={14}/></button></div><div className="game-side-card pink-side"><div className="side-game-icon">🎧</div><h3>اسمع واختار</h3><p>درّبي ودنك على نُطق الإسباني.</p><button onClick={()=>{speakSpanish('Buenos días, ¿cómo estás?');setFeedback('اسمعي الجملة وحاولي تكرريها بصوت عالي!');}}>اسمعي جملة <Volume2 size={15}/></button></div></div></div></div>;
}

function ListeningPage() {
  const items = useMemo(() => buildListeningItems(), []);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('الكل');
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const [language, setLanguage] = useState('ar');
  const selected = items.find((item) => item.id === selectedId) || items[0];
  const visibleItems = items.filter((item) => {
    const matchesLevel = levelFilter === 'الكل' || item.level === levelFilter;
    const searchable = `${item.title} ${item.spanish} ${item.arabic}`.toLocaleLowerCase();
    return matchesLevel && searchable.includes(query.trim().toLocaleLowerCase());
  });

  return <div className="listening-page">
    <section className="listening-intro">
      <div>
        <span className="eyebrow"><Headphones size={15}/> استماع وترجمة</span>
        <h2>اسمعي الجملة واقرئي معناها</h2>
        <p>أمثلة إسبانية وترجماتها العربية مأخوذة من محتوى الدروس المحلي الموجود في التطبيق.</p>
      </div>
      <div className="listening-summary"><b>{items.length}</b><span>مثال محلي</span></div>
    </section>

    <div className="listening-layout">
      <aside className="listening-library" aria-label="أمثلة الاستماع المحلية">
        <div className="listening-library-head"><div><h3>الأمثلة</h3><span>{visibleItems.length} من {items.length}</span></div><AudioLines size={19}/></div>
        <label className="listening-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحثي في الجملة أو المعنى" aria-label="ابحثي في أمثلة الاستماع"/></label>
        <div className="listening-filters" role="group" aria-label="تصفية حسب المستوى">
          {['الكل', 'A1', 'A2'].map((filter) => <button key={filter} className={levelFilter === filter ? 'selected' : ''} onClick={() => setLevelFilter(filter)}>{filter}</button>)}
        </div>
        <div className="listening-items">
          {visibleItems.map((item) => <button key={item.id} className={`listening-item ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => { setSelectedId(item.id); setLanguage('ar'); }} aria-pressed={selected?.id === item.id}>
            <span className="listening-item-icon"><Headphones size={15}/></span>
            <span className="listening-item-copy"><b>{item.title}</b><small lang="es" dir="ltr">{item.spanish}</small></span>
            <span className="listening-item-level">{item.level}</span>
          </button>)}
          {!visibleItems.length && <p className="listening-empty">مفيش مثال مطابق للبحث ده.</p>}
        </div>
      </aside>

      <section className="listening-player" aria-label="مشغل النص والترجمة">
        {selected ? <>
          <div className="listening-player-head">
            <div><span className="listening-kicker">من محتوى الدرس المحلي</span><h3>{selected.title}</h3></div>
            <button className="listening-play" onClick={() => speakSpanish(selected.spanish)}><Volume2 size={17}/> اسمعي الإسباني</button>
          </div>
          <div className="listening-tabs" role="tablist" aria-label="اختاري لغة النص">
            <button id="transcript-tab-es" role="tab" aria-selected={language === 'es'} aria-controls="transcript-panel" className={language === 'es' ? 'active' : ''} onClick={() => setLanguage('es')}>النص الإسباني</button>
            <button id="transcript-tab-ar" role="tab" aria-selected={language === 'ar'} aria-controls="transcript-panel" className={language === 'ar' ? 'active' : ''} onClick={() => setLanguage('ar')}>الترجمة العربية</button>
          </div>
          <div id="transcript-panel" role="tabpanel" aria-labelledby={language === 'ar' ? 'transcript-tab-ar' : 'transcript-tab-es'} className={`listening-transcript ${language === 'ar' ? 'arabic-transcript' : 'spanish-transcript'}`} lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} data-testid={language === 'ar' ? 'arabic-translation' : 'spanish-transcript'}>
            {transcriptText(selected, language)}
          </div>
          <p className="listening-source-note"><Volume2 size={14}/> النطق مولّد من المتصفح، مش تسجيلًا صوتيًا من الكتاب.</p>
        </> : <div className="listening-empty">مفيش أمثلة محلية للعرض.</div>}
      </section>
    </div>
  </div>;
}

function WordsPage({ savedWords, onSaveWord }) {
  const [filter, setFilter] = useState('الكل');
  const words = [{es:'despacio',ar:'بالبطيء / على مهلك',example:'Habla despacio, por favor.',tag:'ظرف',saved:true},{es:'gracias',ar:'شكراً',example:'Muchas gracias por tu ayuda.',tag:'تعبير',saved:false},{es:'la casa',ar:'البيت',example:'Mi casa es pequeña.',tag:'اسم',saved:false},{es:'por favor',ar:'من فضلك',example:'Un café, por favor.',tag:'تعبير',saved:false}];
  const shown = words.filter(w => filter==='المحفوظة' ? savedWords.includes(w.es) : true);
  return <div className="words-page"><div className="words-intro"><div><span className="eyebrow"><Bookmark size={15}/> مفرداتك بتكبر</span><h2>كل كلمة جديدة مكسب 🪴</h2><p>كلمات اتعلمتيها وإنتي ماشية في رحلتك.</p></div><div className="word-count"><b>{Math.max(4, savedWords.length + 3)}</b><span>كلمة في قاموسك</span></div></div><div className="word-tools"><div className="word-search"><Search size={17}/><input placeholder="دوري على كلمة…" /></div><div className="word-filters">{['الكل','المحفوظة'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f}</button>)}</div></div><div className="dictionary-list">{shown.length ? shown.map(w=><article key={w.es} className="dictionary-card"><div className="dictionary-left"><span className="dict-icon">{w.tag==='اسم'?'🏠':w.tag==='ظرف'?'🐢':'💬'}</span><div><span className="word-label">{w.tag} · A1</span><h3>{w.es} <button aria-label={`اسمع ${w.es}`} onClick={()=>speakSpanish(w.es)}><Volume2 size={16}/></button></h3><p>{w.ar}</p><small>{w.example}</small></div></div><button className="save-word" onClick={()=>onSaveWord(w.es)} aria-label="حفظ الكلمة"><Bookmark size={18} fill={savedWords.includes(w.es)?'currentColor':'none'}/></button></article>) : <div className="empty-state">لسه مفيش كلمات محفوظة — دوسي على علامة الحفظ في أي كلمة ⭐</div>}</div><div className="review-reminder"><AudioLines size={19}/><div><b>وقت المراجعة الذكية!</b><span>راجعي كلماتك قبل ما تنسيها، ٣ دقايق بس.</span></div><button onClick={()=>speakSpanish('despacio, gracias, la casa, por favor')}>ابدئي <ArrowLeft size={14}/></button></div></div>;
}

function ProgressPage({ xp, doneLessons }) {
  const achievements = [{icon:'🔥',title:'أول أسبوع',desc:'ذاكري ٧ أيام ورا بعض',progress:'٥ / ٧',tone:'orange'},{icon:'📚',title:'عاشقة الكلمات',desc:'اتعلمي ٥٠ كلمة جديدة',progress:'١٨ / ٥٠',tone:'green'},{icon:'🎯',title:'ملتزمة بهدفك',desc:'كمّلي هدفك اليومي ٥ مرات',progress:'٣ / ٥',tone:'purple'}];
  return <div className="progress-page"><div className="progress-intro"><span className="eyebrow"><Trophy size={15}/> كل خطوة تستاهل احتفال</span><h2>بصي عملتي إيه لحد دلوقتي! 🎉</h2><p>الإنجازات الصغيرة بتعمل فرق كبير.</p></div><div className="progress-summary"><div className="summary-big"><span className="summary-icon">⚡</span><b>{xp}</b><span>نقطة خبرة</span></div><div className="summary-big"><span className="summary-icon">📖</span><b>{doneLessons}</b><span>دروس مكتملة</span></div><div className="summary-big"><span className="summary-icon">🔥</span><b>٥</b><span>أيام متواصلة</span></div><div className="summary-big"><span className="summary-icon">⏱</span><b>٤٢</b><span>دقيقة تعلّم</span></div></div><div className="achievement-heading"><h3>إنجازاتك</h3><span>١ من ١٢ شارة</span></div><div className="achievement-list">{achievements.map((a,i)=><div key={a.title} className="achievement-card"><div className={`achievement-art ${a.tone}`}>{a.icon}</div><div className="achievement-copy"><b>{a.title}</b><span>{a.desc}</span><div className="achievement-progress"><i style={{width:i===0?'70%':i===1?'36%':'60%'}}/></div></div><span className="achievement-count">{a.progress}</span></div>)}</div></div>;
}

function LessonModal({ level = 'A1', lessonId = 'A1-0', onClose, onComplete, courseMode = false, courseIndex = 0, onCoursePrevious }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [saved, setSaved] = useState(false);
  const config = lessonLibrary[lessonId] || lessonLibrary[level === 'A2' ? 'A2-1' : 'A1-0'];
  const courseStage = courseIndex <= 3 ? a1DriveStages[0] : courseIndex <= 6 ? a1DriveStages[1] : a1DriveStages[2];
  useEffect(() => { setStep(0); setAnswer(null); setSaved(false); }, [lessonId]);
  const words = config.words;
  const current = words[step];
  const quiz = step >= words.length;
  function next() { if (quiz) { if (answer === 0) onComplete(); return; } setStep(step + 1); setAnswer(null); }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="lesson-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
    <div className="modal-top"><span>{courseMode ? <><BookOpen size={16}/> {courseStage.id} · كورس A1 · الوحدة {courseIndex}</> : <><BookOpen size={16}/> نموذج درس · {config.heading}</>}</span><button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={19}/></button></div>
    <div className="lesson-progress"><i style={{width:`${quiz?100:(step+1)/(words.length+1)*100}%`}}/></div>
    <div className="modal-content">{!quiz ? <>
      <div className="lesson-step-label">{config.objective}</div>
      <div className="lesson-word-visual"><span>{config.emoji}</span><div className="word-orbit orbit-one"/><div className="word-orbit orbit-two"/></div>
      <h2 id="lesson-title" className="big-spanish" lang="es">{current.es}</h2><p className="big-arabic">{current.ar}</p>
      <div className="pronunciation-line"><span>النطق التقريبي: <b>{current.say}</b></span><button className="listen-button" onClick={()=>speakSpanish(current.es)} title="صوت إسباني مولّد آليًا، مش تسجيل الكتاب"><Volume2 size={17}/> اسمعي النطق</button></div>
      <small className="speech-source-note">صوت إسباني مولّد من جهازك، مش تسجيل الكتاب</small>
      {config.grammar && <div className="a2-grammar-box"><span><BookOpen size={14}/> قاعدة على السريع</span><b>{config.grammar.split(' = ')[0]}</b><small>{config.grammar}</small></div>}
      <div className="lesson-example"><span>💬 مثال جديد</span><b lang="es">{config.example}</b><small>{config.translation}</small></div>
      <button className="save-in-lesson" onClick={()=>setSaved(!saved)}><Bookmark size={16} fill={saved?'currentColor':'none'}/>{saved?'اتحفظت في قاموسك':'احفظي الكلمة'}</button>
    </> : <>
      <div className="lesson-step-label">اختبار سريع · آخر خطوة</div><div className="quiz-finish-icon">🎯</div><h2 id="lesson-title">تمام! نراجع اللي اتعلمناه</h2>
      <p className="quiz-finish-question">{config.question}</p>
      <div className="modal-quiz-answers">{config.answers.map((a,i)=><button key={a} className={answer===i?(i===0?'correct':'wrong'):answer!==null&&i===0?'correct':''} onClick={()=>setAnswer(i)}>{a}{answer===i&&i===0&&<Check size={16}/>}</button>)}</div>
      {answer!==null&&<div className={`quiz-feedback ${answer===0?'good':'try-again'}`}>{answer===0?'صح عليكي! ¡Excelente! 🎉':`الإجابة الصح: ${config.answers[0]}`}</div>}
    </>}</div>
    <div className={`modal-footer ${courseMode ? 'course-modal-footer' : ''}`}>
      {courseMode && <button className="course-prev-button" onClick={onCoursePrevious} disabled={courseIndex===0}><ArrowLeft size={14}/> الدرس السابق</button>}
      <span><span className="modal-xp">⚡</span> +١٥ نقطة خبرة</span>
      <button className="primary-button" onClick={next}>{quiz ? answer===0 ? courseMode ? courseIndex===9?'إنهاء كورس A1':'الدرس التالي' : 'خلصت الدرس' : 'اختاري إجابة' : step===words.length-1?'اختبري نفسك':'الكلمة اللي بعدها'} <ArrowLeft size={16}/></button>
    </div>
  </section></div>;
}

function App() {
  const initial = useMemo(readSaved, []);
  const [active, setActive] = useState('home');
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonLevel, setLessonLevel] = useState('A1');
  const [lessonId, setLessonId] = useState('A1-0');
  const [a1CourseMode, setA1CourseMode] = useState(false);
  const [a1CourseIndex, setA1CourseIndex] = useState(initial.a1CourseIndex || 0);
  const [xp, setXp] = useState(initial.xp || 125);
  const [doneLessons, setDoneLessons] = useState(initial.doneLessons || 3);
  const [savedWords, setSavedWords] = useState(initial.savedWords || ['gracias']);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => { localStorage.setItem('hola-progress', JSON.stringify({xp, doneLessons, savedWords, a1CourseIndex})); }, [xp, doneLessons, savedWords, a1CourseIndex]);
  function openLesson(level = 'A1', lessonId = level === 'A2' ? 'A2-1' : 'A1-0') { setA1CourseMode(false); setLessonLevel(level); setLessonId(lessonId); setLessonOpen(true); }
  function startA1Course(index = 0) {
    const safeIndex = Math.max(0, Math.min(9, index));
    setA1CourseMode(true); setA1CourseIndex(safeIndex); setLessonLevel('A1');
    setLessonId(levels[0].topics[safeIndex].id); setLessonOpen(true);
  }
  function goToA1CourseLesson(index) {
    const safeIndex = Math.max(0, Math.min(9, index));
    setA1CourseIndex(safeIndex); setLessonLevel('A1'); setLessonId(levels[0].topics[safeIndex].id);
  }
  function completeLesson() {
    setXp(x=>x+15); setDoneLessons(x=>x+1);
    if (a1CourseMode && a1CourseIndex < 9) goToA1CourseLesson(a1CourseIndex + 1);
    else { setLessonOpen(false); setA1CourseMode(false); }
  }
  function toggleWord(word) { setSavedWords(items => items.includes(word) ? items.filter(w=>w!==word) : [...items,word]); }
  function page() {
    if (active === 'path') return <PathPage onOpenLesson={openLesson} onStartA1Course={startA1Course} />;
    if (active === 'listening') return <ListeningPage />;
    if (active === 'games') return <GamesPage addXp={amount=>setXp(x=>x+amount)} />;
    if (active === 'words') return <WordsPage savedWords={savedWords} onSaveWord={toggleWord}/>;
    if (active === 'progress') return <ProgressPage xp={xp} doneLessons={doneLessons}/>;
    return <HomePage onOpenLesson={()=>openLesson('A1')} onNavigate={setActive} xp={xp} doneLessons={doneLessons} savedWords={savedWords} onSaveWord={toggleWord}/>;
  }
  return <div className="app-shell"><Sidebar active={active} onNavigate={setActive} streak={5}/><main className="main-area"><Header active={active} onSearch={()=>setSearchOpen(!searchOpen)}/>{searchOpen&&<div className="quick-search"><Search size={18}/><input autoFocus placeholder="دوري على درس، كلمة أو قاعدة…" onKeyDown={e=>e.key==='Escape'&&setSearchOpen(false)}/><button onClick={()=>setSearchOpen(false)} aria-label="إغلاق البحث"><X size={17}/></button></div>}<div className="page-content">{page()}<footer className="app-footer"><span>مصنوع بحب عشان الإسباني يبقى أسهل 💛</span><span>¡Vamos! <span className="footer-star">✳</span></span></footer></div></main>{mobileMenuOpen&&<div className="mobile-drawer"><button className="drawer-close" onClick={()=>setMobileMenuOpen(false)}><X/></button><Sidebar active={active} onNavigate={id=>{setActive(id);setMobileMenuOpen(false)}} streak={5}/></div>}<nav className="mobile-nav" aria-label="تنقل الموبايل">{navItems.map(({id,label,icon:Icon})=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>{lessonOpen&&<LessonModal level={lessonLevel} lessonId={lessonId} courseMode={a1CourseMode} courseIndex={a1CourseIndex} onCoursePrevious={()=>goToA1CourseLesson(a1CourseIndex-1)} onClose={()=>{setLessonOpen(false);setA1CourseMode(false)}} onComplete={completeLesson}/>}</div>;
}

export default App;
