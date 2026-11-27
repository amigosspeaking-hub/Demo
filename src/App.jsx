import React, { useEffect, useMemo, useRef, useState } from 'react';
import { lessonLibrary } from './data/lessons.js';
import bookActivities from './data/bookActivities.json';
import { grammarGuides } from './data/grammar.js';
import { grammarDetails } from './data/grammarDetails.js';
import { lessonStories } from './data/stories.js';
import { lessonSentenceBanks } from './data/sentences.js';
import { compareSpanishReading } from './data/speechPractice.js';
import { courseBookMaterials } from './data/courseMaterials.js';
import { listeningArabicTranscripts } from './data/listeningArabic.js';
import { arcadeScoring, buildChoiceDeck } from './data/arcadeEngine.js';
import { isSpanishText, transcriptSegments } from './data/listeningTranscriptUtils.js';
import './components/direct-reader.css';
import {
  ArrowLeft, ArrowRight, AudioLines, Award, BookOpen, Bookmark, CalendarDays, Captions, Check, CheckCircle2, ChevronLeft,
  CircleHelp, Clock3, ChevronDown, Gamepad2, GraduationCap, Headphones, House, Lightbulb, ListChecks, Pause,
  LockKeyhole, MoreHorizontal, Play, Search, Settings2,
  Sparkles, Target, Trophy, Volume2, X, Zap, Heart, Mic, RotateCcw, Timer, Shuffle
} from 'lucide-react';

const levels = [
  { id: 'A1', name: 'بداية المشوار', book: 'Aula internacional Plus 1', tone: 'mint', lessons: 60, progress: 0, unlocked: true, summary: '١٠ وحدات · ١٠ محاضرات في المسار', topics: [
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
  { id: 'A2', name: 'اتكلم براحتك', book: 'Aula internacional Plus 2', tone: 'peach', lessons: 12, progress: 0, unlocked: true, summary: '١٠ وحدات · ٣ مراحل · ١٢ لقاء', topics: [
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
  { id: 'B2.1', name: 'طلاقة وثقة · ١', book: 'Aula internacional Plus 4', tone: 'yellow', lessons: 40, progress: 0, unlocked: false, summary: 'وسّع قدرتك على النقاش والتعبير', topics: ['عرض الرأي والحجج', 'فهم نصوص أطول', 'تعبيرات أدق', 'تواصل في مواقف متنوعة'] },
  { id: 'B2.2', name: 'طلاقة وثقة · ٢', book: 'Aula internacional Plus 5', tone: 'yellow', lessons: 40, progress: 0, unlocked: false, summary: 'ثبّت B2 واستعد للمستوى المتقدم', topics: ['النقاش والإقناع', 'الفروق الدقيقة', 'اللغة المهنية', 'التعبيرات الاصطلاحية'] },
  { id: 'C1', name: 'إسباني متقدم', book: 'Aula C1', tone: 'blue', lessons: 44, progress: 0, unlocked: false, summary: 'فهم عميق وتعبير مرن ودقيق', topics: ['الأسلوب والسياق', 'نصوص أكاديمية', 'البلاغة والتلميح', 'التعبير المتقدم'] },
];

const a1CourseStages = [
  { id: 'A1.1', units: 'الوحدات ٠–٣', startIndex: 0, endIndex: 3 },
  { id: 'A1.2', units: 'الوحدات ٤–٦', startIndex: 4, endIndex: 6 },
  { id: 'A1.3', units: 'الوحدات ٧–٩', startIndex: 7, endIndex: 9 },
];

const a2Stages = [
  { id: 'A2.1', meetings: 'اللقاءات ١–٤', units: 'الوحدات ١–٤', focus: 'العادات، التعارف، وصف الأشخاص والبيت', grammar: 'المضارع، الأفعال الانعكاسية، الماضي البسيط، وصف الصفات والمقارنة', check: 'مراجعة قصيرة في نهاية المرحلة' },
  { id: 'A2.2', meetings: 'اللقاءات ٥–٨', units: 'الوحدات ٥–٨', focus: 'التواصل اليومي، وقت الفراغ، الطعام والصحة', grammar: 'المضارع المستمر، الماضي القريب، مفعول به مباشر، وصيغة الأمر', check: 'مراجعة قصيرة في نهاية المرحلة' },
  { id: 'A2.3', meetings: 'اللقاءات ٩–١٢', units: 'الوحدتان ٩–١٠ + مراجعة', focus: 'حكي الذكريات واللحظات المهمة ومقارنة زمان بدلوقتي', grammar: 'الماضي الناقص والبسيط والفرق بينهم في الحكي', check: 'مراجعة شاملة ومحاكاة DELE A2' },
];

const navGroups = [
  { label: 'ابدأ', items: [
    { id: 'home', label: 'الرئيسية', icon: House },
    { id: 'lessons', label: 'المحاضرات', icon: BookOpen },
    { id: 'path', label: 'خطة التعلّم', icon: GraduationCap },
  ] },
  { label: 'تدرّب', items: [
    { id: 'listening', label: 'الاستماع', icon: Headphones },
    { id: 'grammar', label: 'الجرامر', icon: BookOpen },
    { id: 'speaking', label: 'التحدث', icon: Mic },
    { id: 'games', label: 'الألعاب', icon: Gamepad2 },
  ] },
  { label: 'مراجعة الكتاب', items: [
    { id: 'flashcards', label: 'بطاقات المراجعة', icon: Bookmark },
    { id: 'quiz', label: 'كويزات الكتاب', icon: CircleHelp },
    { id: 'exam', label: 'امتحانات الكتاب', icon: Award },
  ] },
  { label: 'مكتبتي', items: [
    { id: 'words', label: 'كلماتي', icon: Bookmark },
    { id: 'progress', label: 'إنجازاتي', icon: Trophy },
  ] },
];
const mobileNavItems = [
  { id: 'home', label: 'الرئيسية', icon: House },
  { id: 'lessons', label: 'المحاضرات', icon: BookOpen },
  { id: 'listening', label: 'الاستماع', icon: Headphones },
  { id: 'games', label: 'الألعاب', icon: Gamepad2 },
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


function Sidebar({ active, onNavigate, streak, onProfile, displayName = 'متعلم', selectedStage = 'A1.1' }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><span>¡</span></div><div><b>Hola<span className="brand-dot">.</span></b><small>الإسباني بالمصري</small></div></div>
    <nav className="side-nav" aria-label="التنقل الرئيسي">
      {navGroups.map(group => <div className="side-nav-group" key={group.label}>
        <div className="side-label">{group.label}</div>
        {group.items.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${active === id ? 'active' : ''}`} onClick={() => onNavigate(id)}><Icon size={18} strokeWidth={2}/><span>{label}</span></button>)}
      </div>)}
    </nav>
    <div className="side-spacer" />
    <button className="profile-mini" onClick={onProfile}><div className="avatar">{displayName.slice(0,1) || 'م'}</div><div className="profile-copy"><b>{displayName}</b><span>المستوى {selectedStage} · الملف الشخصي</span></div><MoreHorizontal size={19} /></button>
  </aside>;
}

function Header({ active, onSearch, onProfile, displayName = 'متعلم', selectedStage = 'A1.1' }) {
  const titles = { home: `أهلاً يا ${displayName} 👋`, path: 'رحلتك في الإسباني', lessons: 'محاضرات المستوى', grammar: 'شرح القواعد', listening: 'الاستماع والترجمة', speaking: 'تدرّب على التحدث', games: 'صالة الألعاب', quiz: 'تدريب Quiz', flashcards: 'بطاقات المراجعة', exam: 'امتحانات المستوى', words: 'دفتر الكلمات', progress: 'إنجازاتك', profile: 'الملف الشخصي' };
  const subtitles = {
    home: `مستواك الحالي ${selectedStage} — كمّل خطوة جديدة النهارده.`,
    listening: 'اختر محاضرة، اسمع الجملة، واظهر ترجمتها وقت ما تحب.',
  };
  return <header className="topbar">
    <div className="mobile-brand"><div className="brand-mark"><span>¡</span></div><b>Hola<span className="brand-dot">.</span></b></div>
    <div className="page-heading"><h1>{titles[active]}</h1><p>{subtitles[active] || 'كل يوم خطوة صغيرة تقرّبك من الطلاقة.'}</p></div>
    <div className="top-actions"><button className="icon-button search-button" aria-label="بحث" onClick={onSearch}><Search size={19}/></button><button className="avatar top-avatar" aria-label="الملف الشخصي" onClick={onProfile}>{displayName.slice(0,1) || 'م'}</button></div>
  </header>;
}

function LevelPill({ level = 'A1' }) { return <span className={`level-pill level-${level.toLowerCase().replaceAll('.', '-')}`}>{level}</span>; }

function LessonCard({ lesson, stage, index, completed, onOpen }) {
  const material = courseBookMaterials[lesson.id];
  const page = material?.pages?.[0];
  const title = lesson.heading.replace(/^A[12](?:\.\d)? · /, '');
  return <article className={`lesson-card ${completed ? 'is-complete' : ''}`}>
    <div className="lesson-card-cover">
      {page ? <img src={page.src} alt={`صفحة من ${material.book}`} loading="lazy"/> : <span aria-hidden="true">{lesson.emoji || '📘'}</span>}
      <span className="lesson-card-index">{String(index + 1).padStart(2, '0')}</span>
    </div>
    <div className="lesson-card-body">
      <div className="lesson-card-meta"><LevelPill level={stage}/>{completed && <span className="lesson-complete-label"><CheckCircle2 size={13}/> مكتملة</span>}</div>
      <h3 lang="es" dir="ltr">{title}</h3>
      <p>{lesson.objective}</p>
      <div className="lesson-card-details"><span>{lesson.words.length} كلمات</span>{material?.pages?.length > 0 && <span>{material.pages.length} صفحة</span>}{material?.tracks?.length > 0 && <span>{material.tracks.length} تسجيل</span>}</div>
    </div>
    <button className={completed ? 'lesson-review-button' : 'lesson-start-button'} onClick={() => onOpen(lesson.id)}>{completed ? 'مراجعة' : 'ابدأ'} <ArrowLeft size={15}/></button>
  </article>;
}

function sentenceOfTheDay(selectedStage) {
  const stages = bookActivities.stages || {};
  const collect = stageId => {
    const source = stages[stageId];
    if (!source?.flash) return [];
    return (source.units || []).filter(unit => unit.k !== 'ls').flatMap(unit =>
      (source.flash[unit.k]?.sentences || []).map(sentence => ({
        ...sentence,
        stage: stageId,
        unit: unit.ar,
        title: unit.es,
      })),
    );
  };
  const stageOrder = [selectedStage, ...Object.keys(stages).filter(stageId => stageId !== selectedStage).sort()];
  const pool = stageOrder.flatMap(collect);
  if (!pool.length) return null;
  const now = new Date();
  const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return pool[((dayNumber % pool.length) + pool.length) % pool.length];
}

function HomePage({ onOpenLesson, onNavigate, completedLessons, selectedStage }) {
  const courseLessons = currentLessons(selectedStage);
  const completedCount = courseLessons.filter(lesson => completedLessons.includes(lesson.id)).length;
  const courseProgress = Math.round(completedCount / Math.max(1, courseLessons.length) * 100);
  const nextLesson = courseLessons.find(lesson => !completedLessons.includes(lesson.id)) || courseLessons[0];
  const nextPage = courseBookMaterials[nextLesson?.id]?.pages?.[0];
  const allComplete = courseLessons.length > 0 && completedCount === courseLessons.length;
  const dailySentence = sentenceOfTheDay(selectedStage);

  return <div className="home-dashboard">
    <section className="home-welcome" aria-labelledby="home-welcome-title">
      <div className="home-welcome-copy">
        <span className="eyebrow"><Sparkles size={15}/> {allComplete ? 'مستوى مكتمل' : `مستواك الحالي · ${selectedStage}`}</span>
        <h2 id="home-welcome-title">{allComplete ? 'أحسنت! راجع اللي اتعلمته' : 'كمّل رحلتك، درس واحد في كل مرة'}</h2>
        <p>{allComplete ? 'خلصت كل محاضرات المرحلة. تقدر تراجع أي درس أو تختار مستوى تاني من ملفك.' : nextLesson?.objective || 'اختار محاضرة وابدأ التعلّم.'}</p>
        <div className="home-welcome-actions">
          {nextLesson && <button className="primary-button" onClick={() => onOpenLesson(nextLesson.id)}><Play size={16} fill="currentColor"/>{allComplete ? 'راجع آخر محاضرة' : 'ابدأ المحاضرة التالية'} <ArrowLeft size={16}/></button>}
          <button className="secondary-button" onClick={() => onNavigate('profile')}>تغيير المستوى</button>
        </div>
      </div>
      <div className="home-book-preview">
        {nextPage ? <img src={nextPage.src} alt={`صفحة من كتاب ${courseBookMaterials[nextLesson.id].book}`} fetchPriority="high"/> : <span className="home-book-fallback">{nextLesson?.emoji || '📘'}</span>}
        <div className="home-book-caption"><BookOpen size={15}/><span>{courseBookMaterials[nextLesson?.id]?.book || `مرحلة ${selectedStage}`}</span></div>
      </div>
      <div className="home-stage-progress">
        <div className="home-stage-progress-copy"><span>تقدم {selectedStage}</span><b>{completedCount} من {courseLessons.length} محاضرات</b></div>
        <div className="home-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={courseProgress} aria-label={`تقدم ${selectedStage}`}><i style={{ width: `${courseProgress}%` }}/></div>
        <small>{courseProgress}% من المرحلة مكتمل</small>
      </div>
    </section>

    {dailySentence && <section className="sentence-of-day-card" aria-labelledby="sentence-of-day-title">
      <div className="sentence-of-day-emblem"><CalendarDays size={22}/><span>01</span></div>
      <div className="sentence-of-day-copy"><span className="eyebrow">جملة جديدة كل يوم · من الكتاب الأصلي</span><h2 id="sentence-of-day-title">جملة اليوم</h2>
        <div className="sentence-of-day-pair" dir="ltr"><p className="sentence-of-day-spanish" lang="es" dir="ltr">{dailySentence.es}</p><p className="sentence-of-day-arabic" lang="ar" dir="rtl">{dailySentence.ar}</p></div>
        <small>من {dailySentence.stage} · {dailySentence.unit} · {dailySentence.title}</small>
      </div>
      <button className="sentence-of-day-listen" type="button" onClick={() => speakSpanish(dailySentence.es)}><Volume2 size={18}/> اسمع الجملة</button>
    </section>}

    <section className="home-lessons-section" aria-labelledby="home-lessons-title">
      <div className="home-section-heading"><div><span className="eyebrow"><BookOpen size={14}/> خطة المرحلة</span><h2 id="home-lessons-title">محاضرات {selectedStage}</h2><p>الكتاب والصوتيات والتمارين المرتبطة بكل محاضرة في مكان واحد.</p></div><button className="text-link" onClick={() => onNavigate('lessons')}>عرض المحاضرات <ChevronLeft size={16}/></button></div>
      <div className="home-lesson-list">{courseLessons.map((lesson, index) => <LessonCard key={lesson.id} lesson={lesson} stage={selectedStage} index={index} completed={completedLessons.includes(lesson.id)} onOpen={onOpenLesson}/>)}</div>
    </section>

    <section className="home-tools" aria-labelledby="home-tools-title">
      <div className="home-tools-heading"><div><span className="eyebrow">تدريب إضافي</span><h2 id="home-tools-title">اختار طريقة المراجعة</h2></div></div>
      <div className="home-tool-links">
        <button onClick={() => onNavigate('listening')}><span className="home-tool-icon"><Headphones size={18}/></span><span><b>استماع الكتاب</b><small>التسجيلات حسب المرحلة</small></span><ChevronLeft size={17}/></button>
        <button onClick={() => onNavigate('grammar')}><span className="home-tool-icon"><BookOpen size={18}/></span><span><b>شرح القواعد</b><small>راجع جرامر المحاضرات</small></span><ChevronLeft size={17}/></button>
        <button onClick={() => onNavigate('games')}><span className="home-tool-icon"><Gamepad2 size={18}/></span><span><b>ألعاب قصيرة</b><small>تدريب تفاعلي للمستوى</small></span><ChevronLeft size={17}/></button>
      </div>
    </section>
  </div>;
}

function PathPage({ onOpenLesson, onOpenActivity, selectedStage = 'A1.1', completedLessons = [] }) {
  const lessons = currentLessons(selectedStage);
  const completeCount = lessons.filter(lesson => completedLessons.includes(lesson.id)).length;
  const courseProgress = Math.round(completeCount / Math.max(1, lessons.length) * 100);
  const sequence = [
    { id: 'lesson', label: 'المحاضرة', detail: 'افتح صفحة الوحدة الأصلية والشرح', page: null, icon: BookOpen, tone: 'green' },
    { id: 'grammar', label: 'الجرامر', detail: 'شرح القاعدة الموجودة في الدرس', page: 'grammar', icon: BookOpen, tone: 'blue' },
    { id: 'listening', label: 'الاستماع', detail: 'اسمع تسجيلات الكتاب المرتبطة بالوحدة', page: 'listening', icon: Headphones, tone: 'peach' },
    { id: 'games', label: 'الألعاب', detail: 'راجع كلمات الدرس بألعاب تفاعلية', page: 'games', icon: Gamepad2, tone: 'purple' },
    { id: 'speaking', label: 'التحدث والتصحيح', detail: 'انطق، طابق، وراجع أخطاءك', page: 'speaking', icon: Mic, tone: 'yellow' },
    { id: 'quiz', label: 'التمارين والـ Quiz', detail: 'تدرّب من تمارين الكتاب وأسئلته', page: 'quiz', icon: CircleHelp, tone: 'mint' },
    { id: 'exam', label: 'امتحان الدرس', detail: 'اختبر نفسك في محتوى الوحدة', page: 'exam', icon: Award, tone: 'coral' },
  ];
  return <div className="path-page island-path-page">
    <section className="path-intro island-path-intro"><div><span className="eyebrow"><GraduationCap size={15}/> رحلتي · {selectedStage}</span><h2>جزر التعلّم بالترتيب</h2><p>كل جزيرة تمشي معاك من المحاضرة لحد امتحانها، وبعدها تبدأ جزيرة المحاضرة التالية.</p></div><div className="path-sticker">🗺️</div></section>
    <section className="island-path-summary"><div className="island-summary-copy"><span>تقدّمك في {selectedStage}</span><b>{completeCount} من {lessons.length} محاضرات مكتملة</b></div><div className="island-summary-progress" role="progressbar" aria-label={`تقدم ${selectedStage}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={courseProgress}><i style={{ width: `${courseProgress}%` }}/></div><strong>{courseProgress}%</strong></section>
    <div className="learning-island-list">{lessons.map((lesson, lessonIndex) => {
      const material = courseBookMaterials[lesson.id];
      const sourceStage = bookActivities.stages?.[courseForLesson(lesson.id)];
      const nativeUnit = nativeBookUnitForLesson(lesson.id);
      const originalQuizCount = (sourceStage?.quiz?.[nativeUnit] || []).length + (sourceStage?.listen?.bank || []).filter(item => item.tunit === nativeUnit).length;
      const grammarTitle = grammarGuides[lesson.id]?.title || lesson.grammar || 'شرح القاعدة';
      return <article className={`learning-island ${completedLessons.includes(lesson.id) ? 'island-complete' : ''}`} key={lesson.id}>
        <div className="island-arrival-mark"><span className="island-flag">{completedLessons.includes(lesson.id) ? '✓' : String(lessonIndex + 1).padStart(2, '0')}</span><span className="island-dots"/></div>
        <header className="learning-island-header"><div className="island-cover">{material?.pages?.[0] ? <img src={material.pages[0].src} alt={`غلاف من ${material.book} · ${material.unit}`} loading="lazy"/> : <span>{lesson.emoji || '📘'}</span>}<b>{lessonIndex + 1}</b></div><div className="island-title-copy"><span className="eyebrow">جزيرة {lessonIndex + 1} · {selectedStage}</span><h3 lang="es" dir="ltr">{lesson.heading.replace(/^A[12](?:\.\d)? · /, '')}</h3><p>{lesson.objective}</p><div className="island-meta"><span>{material?.unit || `محاضرة ${lessonIndex + 1}`}</span><span>{material?.pages?.length || 0} صفحة محاضرة</span><span>{material?.tracks?.length || 0} تسجيل كتاب</span></div></div><span className="island-completion-status">{completedLessons.includes(lesson.id) ? 'مكتملة ✓' : 'جزيرة جديدة'}</span></header>
        <div className="island-steps" role="list" aria-label={`خطوات جزيرة ${lesson.heading}`}>
          {sequence.map((step, stepIndex) => {
            const Icon = step.icon;
            const detail = step.id === 'grammar' ? grammarTitle
              : step.id === 'listening' ? `${material?.tracks?.length || 0} تسجيلات أصلية من الكتاب`
              : step.id === 'quiz' ? originalQuizCount ? `${originalQuizCount} سؤالًا أصليًا من الملف` : 'أنشطة الوحدة الأصلية داخل صفحات الكتاب'
              : step.id === 'speaking' ? 'تدرّب على النطق وشوف التصحيح خطوة بخطوة'
              : step.detail;
            return <button className={`island-step tone-${step.tone}`} role="listitem" key={step.id} onClick={() => step.page ? onOpenActivity(step.page, lesson.id) : onOpenLesson(lesson.id)}>
              <span className="island-step-number">{String(stepIndex + 1).padStart(2, '0')}</span><span className="island-step-icon"><Icon size={17}/></span><span className="island-step-copy"><b>{step.label}</b><small>{detail}</small></span><span className="island-step-action">{step.id === 'lesson' ? 'ابدأ' : 'افتح'} <ChevronLeft size={15}/></span>
            </button>;
          })}
        </div>
        {lessonIndex < lessons.length - 1 && <div className="island-next-hint"><span>بعد ما تخلص، كمّل للجزيرة التالية</span><ArrowLeft size={14}/></div>}
      </article>;
    })}</div>
  </div>;
}

function WordsPage({ stage, savedWords, onSaveWord }) {
  const [filter, setFilter] = useState('الكل');
  const [query, setQuery] = useState('');
  const words = currentLessons(stage).flatMap(lesson => lesson.words.map(word => ({ ...word, lesson: lesson.heading, example: lesson.example, tag: 'كلمة' })));
  const shown = words.filter(word => (filter !== 'المحفوظة' || savedWords.includes(word.es)) && `${word.es} ${word.ar} ${word.lesson}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className="words-page"><div className="words-intro"><div><span className="eyebrow"><Bookmark size={15}/> مفردات {stage}</span><h2>بنك كلمات المحاضرات</h2><p>الكلمات هنا مرتبطة بالمستوى الحالي وبطاقات المراجعة.</p></div><div className="word-count"><b>{words.length}</b><span>كلمة في المستوى</span></div></div><div className="word-tools"><label className="word-search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="دور على كلمة أو معنى…" /></label><div className="word-filters">{['الكل','المحفوظة'].map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="dictionary-list">{shown.length ? shown.map(word => <article key={`${word.lesson}-${word.es}`} className="dictionary-card"><div className="dictionary-left"><span className="dict-icon">📘</span><div><span className="word-label">{stage} · {word.lesson.replace(/^A[12](?:\.\d)? · /, '')}</span><h3 lang="es" dir="ltr">{word.es} <button aria-label={`اسمع ${word.es}`} onClick={() => speakSpanish(word.es)}><Volume2 size={16}/></button></h3><p>{word.ar}</p><small lang="es" dir="ltr">{word.example}</small></div></div><button className="save-word" onClick={() => onSaveWord(word.es)} aria-label={savedWords.includes(word.es) ? 'إزالة من كلماتي' : 'إضافة إلى كلماتي'}><Bookmark size={18} fill={savedWords.includes(word.es) ? 'currentColor' : 'none'}/></button></article>) : <div className="empty-state">{filter === 'المحفوظة' ? 'مافيش كلمات محفوظة من المستوى ده لسه.' : 'مفيش كلمة مطابقة للبحث.'}</div>}</div><div className="review-reminder"><AudioLines size={19}/><div><b>مراجعة نفس بنك الكلمات</b><span>الكلمة اللي تحفظها بتظهر في فلتر المحفوظة وبطاقات المستوى.</span></div><button onClick={() => setFilter('المحفوظة')}>المحفوظة <ArrowLeft size={14}/></button></div></div>;
}
function ProgressPage({ xp, doneLessons, savedWords, selectedStage }) {
  const achievements = [
    { icon: '📚', title: 'أول خمس محاضرات', desc: 'كمّل خمس محاضرات من الكورس', count: `${Math.min(doneLessons, 5)} / 5`, pct: Math.min(doneLessons / 5 * 100, 100), tone: 'green' },
    { icon: '🔖', title: 'قاموسك الشخصي', desc: 'احفظ عشر كلمات للمراجعة', count: `${Math.min(savedWords.length, 10)} / 10`, pct: Math.min(savedWords.length / 10 * 100, 100), tone: 'orange' },
    { icon: '⚡', title: 'نقاط الخبرة', desc: 'اجمع ١٠٠ نقطة من التدريب', count: `${Math.min(xp, 100)} / 100`, pct: Math.min(xp, 100), tone: 'purple' },
  ];
  return <div className="progress-page"><div className="progress-intro"><span className="eyebrow"><Trophy size={15}/> تقدمك المسجّل</span><h2>كل تدريب بيتحسب هنا</h2><p>الأرقام دي من الأنشطة المكتملة على جهازك.</p></div><div className="progress-summary"><div className="summary-big"><span className="summary-icon">⚡</span><b>{xp}</b><span>نقطة خبرة</span></div><div className="summary-big"><span className="summary-icon">📖</span><b>{doneLessons}</b><span>محاضرة مكتملة</span></div><div className="summary-big"><span className="summary-icon">🔖</span><b>{savedWords.length}</b><span>كلمة محفوظة</span></div><div className="summary-big"><span className="summary-icon">🎓</span><b>{selectedStage}</b><span>المستوى الحالي</span></div></div><div className="achievement-heading"><h3>أهدافك القادمة</h3><span>تتحدّث مع تقدمك</span></div><div className="achievement-list">{achievements.map(item => <div key={item.title} className="achievement-card"><div className={`achievement-art ${item.tone}`}>{item.icon}</div><div className="achievement-copy"><b>{item.title}</b><span>{item.desc}</span><div className="achievement-progress"><i style={{ width: `${item.pct}%` }}/></div></div><span className="achievement-count">{item.count}</span></div>)}</div></div>;
}
function courseForLesson(id) {
  const match = /^(A1|A2)-(\d+)$/.exec(id || '');
  if (!match) return null;
  const [, level, rawIndex] = match;
  const index = Number(rawIndex);
  return level === 'A2' ? (index >= 1 && index <= 4 ? 'A2.1' : index >= 5 && index <= 8 ? 'A2.2' : index >= 9 && index <= 10 ? 'A2.3' : null)
    : index <= 3 ? 'A1.1' : index <= 6 ? 'A1.2' : index <= 9 ? 'A1.3' : null;
}
function readerUnitsForLesson(id) {
  const match = /^(A1|A2)-(\d+)$/.exec(id || '');
  if (!match) return [];
  const [, level, rawIndex] = match;
  const index = Number(rawIndex);
  if (level === 'A1') return [`u${index + 1}`];
  return index === 10 ? ['u10a', 'u10b'] : [`u${index}`];
}
function originalReaderForLesson(id) {
  const course = courseForLesson(id);
  const material = courseBookMaterials[id];
  const firstPage = material?.pages?.[0]?.page;
  const units = readerUnitsForLesson(id);
  if (!course || !firstPage || !units.length) return null;
  return { course, unit: material.unit, title: material.title, lessonId: id, page: firstPage, src: `/materials/readers/${course}/index.html?unit=${encodeURIComponent(units.join(','))}#p${firstPage}` };
}

function OriginalBookReader({ reader }) {
  return <section className="book-reader-panel" aria-label={`قارئ ${reader.unit}`}>
    <div className="book-reader-toolbar"><div><span className="book-reader-kicker"><BookOpen size={14}/> ملف الكتاب الأصلي · {reader.unit}</span><b lang="es" dir="ltr">{reader.title}</b><small>صفحات وأنشطة المحاضرة دي بس.</small></div></div>
    <iframe title={`كتاب ${reader.unit} · ${reader.title}`} src={reader.src} loading="eager" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin" allow="autoplay" />
  </section>;
}

function installReaderReturnControl(frame, onReturn) {
  const doc = frame.contentDocument;
  if (!doc) return;
  const toolbar = doc.querySelector('.top1') || doc.querySelector('.top');
  if (!toolbar) return;
  const existing = doc.getElementById('arena-reader-return');
  if (existing) { existing.onclick = onReturn; return; }
  toolbar.style.position = 'relative';
  const style = doc.createElement('style');
  style.id = 'arena-reader-return-style';
  style.textContent = `#arena-reader-return{position:absolute!important;inset-inline-start:12px!important;top:50%!important;transform:translateY(-50%)!important;z-index:100!important;min-height:34px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 11px;border:1px solid #d9e7dc;border-radius:999px;background:#315f49;color:#fff;box-shadow:0 3px 10px #15251d20;font:700 12px 'IBM Plex Sans Arabic',Tahoma,sans-serif;cursor:pointer}#arena-reader-return:hover{background:#203d31}#arena-reader-return svg{width:16px;height:16px;flex:none}@media(max-width:560px){#arena-reader-return{min-height:32px;padding:5px 9px;font-size:11px}}`;
  doc.head.appendChild(style);
  const button = doc.createElement('button');
  button.id = 'arena-reader-return';
  button.type = 'button';
  button.setAttribute('dir', 'rtl');
  button.setAttribute('aria-label', 'العودة إلى التطبيق');
  const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M5 12h14m-7-7 7 7-7 7');
  icon.appendChild(path);
  const label = doc.createElement('span');
  label.textContent = 'العودة';
  button.append(icon, label);
  button.onclick = onReturn;
  toolbar.appendChild(button);
}
function DirectOriginalBookReader({ reader, onClose }) {
  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return <section className="direct-book-reader" aria-label={`قارئ الكتاب الأصلي ${reader.unit}`}>
    <iframe title={`كتاب ${reader.unit} · ${reader.title}`} src={reader.src} loading="eager" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin" allow="autoplay" onLoad={event => installReaderReturnControl(event.currentTarget, onClose)} />
  </section>;
}

function LessonModal({ level = 'A1', lessonId = 'A1-0', onClose, onComplete, onSaveWord, savedWords = [], isCompleted = false, courseMode = false, courseIndex = 0, onCoursePrevious }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const config = lessonLibrary[lessonId] || lessonLibrary[level === 'A2' ? 'A2-1' : 'A1-0'];
  const reader = originalReaderForLesson(lessonId);
  const courseStage = courseIndex <= 3 ? a1CourseStages[0] : courseIndex <= 6 ? a1CourseStages[1] : a1CourseStages[2];
  useEffect(() => { setStep(0); setAnswer(null); setReaderOpen(false); }, [lessonId]);
  const words = config.words;
  const current = words[step];
  const grammarGuide = grammarGuides[lessonId];
  const quiz = step >= words.length;
  const sourceQuiz = quiz ? nativeQuestionsForLesson(lessonId).find(item => !item.listening) : null;
  const quizPassed = Boolean(sourceQuiz && answer === sourceQuiz.correct);
  function next() { if (quiz) { if (quizPassed) onComplete(); return; } setStep(step + 1); setAnswer(null); }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className={`lesson-modal ${readerOpen ? 'lesson-modal-reader' : ''}`} role="dialog" aria-modal="true" aria-labelledby={readerOpen ? 'book-reader-title' : 'lesson-title'}>
    <div className={`modal-top ${readerOpen ? 'lesson-reader-topbar' : ''}`}><span id={readerOpen ? 'book-reader-title' : undefined}>{readerOpen ? <><BookOpen size={16}/> ملف الوحدة · {reader?.unit}</> : courseMode ? <><BookOpen size={16}/> {courseStage.id} · كورس A1 · الوحدة {courseIndex}</> : <><BookOpen size={16}/> نموذج درس · {config.heading}</>}</span>{readerOpen && <button className="lesson-return-top-button" type="button" onClick={() => setReaderOpen(false)}><ArrowRight size={16}/> العودة للمحاضرة</button>}<button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={19}/></button></div>
    <div className="lesson-progress"><i style={{width:`${quiz?100:(step+1)/(words.length+1)*100}%`}}/></div>
    <div className="modal-content">{readerOpen && reader ? <OriginalBookReader reader={reader}/> : !quiz ? <>
      <div className="lesson-step-label">{config.objective}</div>
      <div className="lesson-word-visual"><span>{config.emoji}</span><div className="word-orbit orbit-one"/><div className="word-orbit orbit-two"/></div>
      <h2 id="lesson-title" className="big-spanish" lang="es">{current.es}</h2><p className="big-arabic">{current.ar}</p>
      <div className="pronunciation-line"><span>النطق التقريبي: <b>{current.say}</b></span><button className="listen-button" onClick={()=>speakSpanish(current.es)} title="صوت إسباني مولّد آليًا، مش تسجيل الكتاب"><Volume2 size={17}/> اسمع النطق</button></div>
      <small className="speech-source-note">صوت إسباني مولّد من جهازك، مش تسجيل الكتاب</small>
      {grammarGuide && <div className="lesson-grammar-detail"><span><BookOpen size={14}/> {grammarGuide.title}</span><p>{grammarGuide.explanation}</p>{grammarGuide.examples.slice(0, 1).map(([es, ar]) => <div key={es}><b lang="es" dir="ltr">{es}</b><small>{ar}</small></div>)}</div>}
      <div className="lesson-example"><span>💬 مثال الدرس</span><b lang="es">{config.example}</b><small>{config.translation}</small></div>
      <BookLessonMaterials lessonId={lessonId}/>
      {reader && <button className="book-reader-launch" type="button" onClick={() => setReaderOpen(true)}><span className="book-reader-launch-icon"><BookOpen size={19}/></span><span><b>افتح صفحات الكتاب في القارئ</b><small>{reader.unit} · صفحات وأنشطة الوحدة الأصلية فقط</small></span><ArrowLeft size={17}/></button>}
      <button className="save-in-lesson" onClick={() => onSaveWord(current.es)}><Bookmark size={16} fill={savedWords.includes(current.es) ? 'currentColor' : 'none'}/>{savedWords.includes(current.es) ? 'اتحفظت في قاموسك' : 'احفظ الكلمة'}</button>
    </> : <>
      <div className="lesson-step-label">{sourceQuiz ? 'سؤال من تمارين الكتاب الأصلي' : 'الأنشطة الأصلية للمحاضرة'}</div><div className="quiz-finish-icon">{sourceQuiz ? '🎯' : '📖'}</div><h2 id="lesson-title">{sourceQuiz ? 'اختبر فهمك' : 'كمّل التدريب من صفحات الكتاب'}</h2>
      {sourceQuiz ? <><p className="quiz-finish-question"><BidiText>{sourceQuiz.prompt}</BidiText></p><div className="modal-quiz-answers">{sourceQuiz.options.map(option => <button key={option} lang={isSpanishText(option) ? 'es' : 'ar'} dir={isSpanishText(option) ? 'ltr' : 'rtl'} className={`${answer === option ? (option === sourceQuiz.correct ? 'correct' : 'wrong') : ''} ${answer !== null && option === sourceQuiz.correct ? 'correct' : ''}`} onClick={() => setAnswer(option)}><BidiText>{option}</BidiText>{answer === option && option === sourceQuiz.correct && <Check size={16}/>}</button>)}</div>{answer !== null && <div className={`quiz-feedback ${quizPassed ? 'good' : 'try-again'}`}>{quizPassed ? 'إجابة صحيحة — ممتاز!' : <>راجع الإجابة الصحيحة: <BidiText>{sourceQuiz.correct}</BidiText></>}<small><ListeningExplanation text={sourceQuiz.explanation}/></small></div>}</> : <><p className="quiz-finish-question">مافيش بنك أسئلة رقمي أصلي لهذه الوحدة؛ افتح ملف المحاضرة واستخدم التدريبات التفاعلية الموجودة فيه.</p><button className="primary-button" onClick={() => setReaderOpen(true)} disabled={!reader}>افتح تدريبات الوحدة الأصلية <BookOpen size={16}/></button></>}
    </>}</div>
    <div className={`modal-footer ${courseMode ? 'course-modal-footer' : ''}`}>
      {readerOpen ? <span>صفحات الكتاب والتدريبات داخل الموقع</span> : <>
        {courseMode && <button className="course-prev-button" onClick={onCoursePrevious} disabled={courseIndex<=courseStage.startIndex}><ArrowLeft size={14}/> الدرس السابق</button>}
        <span>{isCompleted ? 'المحاضرة دي مكتملة قبل كده' : <><span className="modal-xp">⚡</span> +١٥ نقطة خبرة</>}</span>
        <button className="primary-button" onClick={quiz && !sourceQuiz ? () => setReaderOpen(true) : next} disabled={quiz && sourceQuiz && !quizPassed}>{quiz ? sourceQuiz ? quizPassed ? courseMode ? courseIndex===courseStage.endIndex?`إنهاء ${courseStage.id}`:'الدرس التالي' : 'خلصت الدرس' : 'راجع الإجابة' : 'افتح تمارين الكتاب' : step===words.length-1?'اختبر نفسك':'الكلمة اللي بعدها'} <ArrowLeft size={16}/></button>
      </>}
    </div>
  </section></div>;
}

const courseRanges = {
  'A1.1': [0, 3], 'A1.2': [4, 6], 'A1.3': [7, 9],
  'A2.1': [1, 4], 'A2.2': [5, 8], 'A2.3': [9, 10],
};
const courseOptions = Object.keys(courseRanges);
const gameCatalog = [
  { id: 'match', title: 'وصّل المعنى', description: 'كوّن أزواجًا بين مفردات الوحدة ومعانيها.', instructions: 'اختار التعبير الإسباني، وبعده معناه بالعربي. كل زوج صح يثبت مكانه؛ الغلط يقطع السلسلة ويخصم قلبًا في التحدي.', icon: '🧩' },
  { id: 'quiz', title: 'تحدّي الأسئلة', description: 'اختبر المفردات والقواعد وفهم قصة الوحدة.', instructions: 'اقرأ السؤال واختار إجابة واحدة. موضع الإجابة الصحيحة بيتغيّر، والتفسير يظهر بعد إجابتك.', icon: '🎯' },
  { id: 'listen', title: 'استماع الكتاب', description: 'اسمع التسجيل الأصلي وجاوب أسئلة الكتاب.', instructions: 'اقرأ السؤال المحدد قبل التسجيل؛ المطلوب يختلف من مقطع لآخر. اسمع التسجيل الأصلي للآخر، ثم اختار الإجابة.', icon: '🎧' },
  { id: 'storyListen', title: 'استمع للقصة', description: 'اسمع جملة من القصة بصوت إسباني آلي واختار معناها.', instructions: 'ابدأ تشغيل الجملة الإسبانية الآلية قبل الإجابة. ده نطق آلي للقصة، مش تسجيل الكتاب الأصلي.', icon: '🗣️' },
  { id: 'order', title: 'ابنِ الجملة', description: 'رتّب الكلمات عشان تكوّن جمل الوحدة كاملة.', instructions: 'رتّب الكلمات، تحقّق من الجملة، وصحّحها بنفسك لو فيه خطأ؛ مفيش اختيار من متعدد هنا.', icon: '🔤' },
];
const arcadeModes = [
  { id: 'practice', title: 'تدريب', description: 'براحتك · من غير مؤقّت أو خصم قلوب', icon: '🌱', timed: false, lives: null, seconds: 0, multiplier: 1, rounds: { match: 5, standard: 6 } },
  { id: 'challenge', title: 'تحدّي', description: '٩٠ ثانية · ٣ قلوب · بنك أكبر', icon: '🔥', timed: true, lives: 3, seconds: 90, multiplier: 1.5, rounds: { match: 8, standard: 10 } },
  { id: 'sprint', title: 'جولة سريعة', description: '٤٥ ثانية · قلب واحد · نقاط مضاعفة', icon: '⚡', timed: true, lives: 1, seconds: 45, multiplier: 2, rounds: { match: 4, standard: 5 } },
];
function currentLessons(stage = 'A1.1') {
  const [from, to] = courseRanges[stage] || courseRanges['A1.1'];
  const prefix = stage.startsWith('A2') ? 'A2-' : 'A1-';
  return Object.entries(lessonLibrary).filter(([id]) => {
    if (!id.startsWith(prefix)) return false;
    const n = Number(id.split('-')[1]);
    return n >= from && n <= to;
  }).map(([id, lesson]) => ({ id, ...lesson }));
}
function questionPool(stage, onlyLessonId) {
  const stageLessons = currentLessons(stage);
  const lessons = onlyLessonId ? stageLessons.filter(item => item.id === onlyLessonId) : stageLessons;
  return lessons.flatMap(lesson => {
    const translations = [
      ...lesson.words.map(word => word.ar), ...(lesson.answers || []),
      ...(grammarGuides[lesson.id]?.examples || []).map(([, ar]) => ar),
      ...(lessonStories[lesson.id]?.sentences || []).map(sentence => sentence.ar),
    ];
    const grammarQuestions = (grammarGuides[lesson.id]?.examples || []).map(([es, ar], index) => ({ prompt: `اختار معنى المثال: ${es}`, correct: ar, spanish: es, source: `أمثلة القاعدة · ${lesson.heading}`, explanation: grammarGuides[lesson.id]?.title }));
    const storyQuestions = (lessonStories[lesson.id]?.sentences || []).map((sentence, index) => ({ prompt: `اختار معنى جملة القصة ${index + 1}:`, correct: sentence.ar, spanish: sentence.es, source: `قصة الوحدة · ${lessonStories[lesson.id]?.title}`, explanation: sentence.es }));
    const questions = [
      ...lesson.words.map(word => ({ prompt: `يعني إيه «${word.es}»؟`, correct: word.ar, spanish: word.es, source: `مفردات · ${lesson.heading}` })),
      { prompt: lesson.question, correct: lesson.answers[0], spanish: lesson.example, source: `سؤال الدرس · ${lesson.heading}`, explanation: lesson.grammar },
      ...grammarQuestions,
      ...storyQuestions,
    ];
    return questions.map(item => ({ ...item, options: [...new Set([item.correct, ...shuffled(translations.filter(value => value !== item.correct))])].slice(0, 4) }));
  });
}
function matchBankForLesson(lesson) {
  if (!lesson) return [];
  const candidates = [
    ...lesson.words,
    ...(grammarDetails[lesson.id] || []).map(topic => ({ es: topic.es, ar: topic.ar })),
    ...(grammarGuides[lesson.id]?.examples || []).map(([es, ar]) => ({ es, ar })),
  ];
  const seenSpanish = new Set();
  const seenArabic = new Set();
  return candidates.filter(item => {
    if (!item.es || !item.ar || seenSpanish.has(item.es) || seenArabic.has(item.ar)) return false;
    seenSpanish.add(item.es); seenArabic.add(item.ar); return true;
  });
}
function orderBankForLesson(lesson) {
  if (!lesson) return [];
  const sentences = [lesson.example, ...(lessonSentenceBanks[lesson.id] || []), ...(lessonStories[lesson.id]?.sentences || []).map(sentence => sentence.es)];
  return [...new Set(sentences.map(sentence => sentence?.trim()).filter(Boolean))];
}
function storyListeningBank(lesson) {
  const sentences = lessonStories[lesson?.id]?.sentences || [];
  return sentences.map((sentence, index) => ({
    prompt: `اختار معنى الجملة ${index + 1} بعد الاستماع.`,
    correct: sentence.ar,
    spanish: sentence.es,
    source: `نطق آلي · قصة ${lessonStories[lesson.id].title}`,
    options: [...new Set([sentence.ar, ...shuffled(sentences.filter(item => item.ar !== sentence.ar).map(item => item.ar).concat(lesson.words.map(word => word.ar)))])].slice(0, 4),
  }));
}
function arcadeBankFor(gameId, stage, lesson) {
  if (!lesson) return [];
  if (gameId === 'match') return matchBankForLesson(lesson);
  if (gameId === 'quiz') return questionPool(stage, lesson.id);
  if (gameId === 'listen') return nativeQuestionsForLesson(lesson.id).filter(item => item.listening && item.audio);
  if (gameId === 'storyListen') return storyListeningBank(lesson);
  if (gameId === 'order') return orderBankForLesson(lesson);
  return [];
}
function arcadeRoundLimit(gameId, mode) { return mode.rounds[gameId === 'match' ? 'match' : 'standard']; }
function loadArcadeRecords() {
  try { const value = JSON.parse(localStorage.getItem('hola-arcade-records') || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
}
function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [copy[index], copy[swap]] = [copy[swap], copy[index]]; }
  return copy;
}
function drawQuestions(pool, amount) { return shuffled(pool).slice(0, Math.min(amount, pool.length)); }
function textDirectionFromContent(text = '') {
  for (const character of String(text)) {
    if (/\p{Script=Arabic}/u.test(character)) return 'rtl';
    if (/\p{Script=Latin}/u.test(character)) return 'ltr';
  }
  return 'ltr';
}
function BidiSelect({ value, onChange, options, disabled = false, ariaLabel, className = '' }) {
  const selected = options.find(option => String(option.value) === String(value)) || options[0];
  const direction = textDirectionFromContent(selected?.label);
  return <select className={className} value={value} onChange={onChange} disabled={disabled} aria-label={ariaLabel} dir={direction} style={{ direction }}>
    {options.map(option => {
      const optionDirection = textDirectionFromContent(option.label);
      return <option key={option.value} value={option.value} dir={optionDirection} style={{ direction: optionDirection }}>{option.label}</option>;
    })}
  </select>;
}
function CourseSelect({ value, onChange, label = 'المستوى' }) {
  const options = courseOptions.map(stage => ({ value: stage, label: stage }));
  return <label className="course-select"><span>{label}</span><BidiSelect value={value} onChange={event => onChange(event.target.value)} options={options}/></label>;
}
function ProfilePage({ selectedStage, onSelectStage, displayName, onChangeName, xp, doneLessons }) {
  return <div className="profile-page">
    <section className="profile-hero"><div className="profile-avatar-large">{displayName.slice(0, 1) || 'م'}</div><div><span className="eyebrow"><GraduationCap size={15}/> ملف متعلمك</span><h2>{displayName}</h2><p>إعدادات المستوى والتقدم محفوظة على هذا الجهاز.</p></div></section>
    <section className="profile-settings-card"><h3>بيانات الملف</h3><label className="profile-field"><span>الاسم الظاهر</span><input value={displayName} maxLength={24} onChange={event => onChangeName(event.target.value)} placeholder="اكتب اسمك" /></label>
      <CourseSelect value={selectedStage} onChange={onSelectStage} label="المستوى الحالي" />
      <p className="profile-help">المستوى المحدد هو الذي يظهر في المحاضرات والتدريبات والألعاب؛ تقدر تغيّره في أي وقت.</p>
    </section>
    <section className="profile-stat-row"><div><b>{xp}</b><span>نقطة خبرة</span></div><div><b>{doneLessons}</b><span>محاضرة مكتملة</span></div><div><b>{selectedStage}</b><span>مستواك المحدد</span></div></section>
  </div>;
}
function LessonsPage({ stage, onSelectStage, onOpenLesson, completedLessons = [] }) {
  const lessons = currentLessons(stage);
  const completedCount = lessons.filter(lesson => completedLessons.includes(lesson.id)).length;
  const progress = Math.round(completedCount / Math.max(1, lessons.length) * 100);
  return <div className="course-page redesigned-lessons-page">
    <section className="course-page-intro lesson-page-intro">
      <div className="lesson-page-title"><span className="eyebrow"><BookOpen size={15}/> خطة المحاضرات</span><h2>كل محاضرات {stage} في مكان واحد</h2><p>اختار درسًا عشان تفتح شرحه وصورة الكتاب والصوتيات المرتبطة به.</p></div>
      <CourseSelect value={stage} onChange={onSelectStage} label="المستوى"/>
      <div className="lesson-page-progress"><div className="home-stage-progress-copy"><span>إنجاز المرحلة</span><b>{completedCount} من {lessons.length} مكتملة</b></div><div className="home-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><i style={{ width: `${progress}%` }}/></div></div>
    </section>
    <div className="course-lesson-list lesson-page-list">{lessons.map((lesson, index) => <LessonCard key={lesson.id} lesson={lesson} stage={stage} index={index} completed={completedLessons.includes(lesson.id)} onOpen={id => onOpenLesson(stage.startsWith('A2') ? 'A2' : 'A1', id)}/>)}</div>
  </div>;
}

function BookAudioPlayer({ track, activePanel, onPanelChange, hasTranscript = false, hasSummary = false, hasExercises = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState('');
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    audio.pause(); audio.currentTime = 0; audio.playbackRate = 1;
    setPlaying(false); setCurrentTime(0); setDuration(0); setRate(1); setError('');
    return () => audio.pause();
  }, [track?.src]);
  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    setError('');
    if (audio.paused) {
      try { await audio.play(); } catch { setError('No se pudo reproducir este audio.'); }
    } else audio.pause();
  }
  function changeRate(value) {
    setRate(value);
    if (audioRef.current) audioRef.current.playbackRate = value;
  }
  const timeLabel = value => `${Math.floor((value || 0) / 60)}:${String(Math.floor((value || 0) % 60)).padStart(2, '0')}`;
  if (!track) return null;
  function skip(seconds) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration || Infinity, audioRef.current.currentTime + seconds));
    setCurrentTime(audioRef.current.currentTime);
  }
  const progress = duration ? `${Math.min(100, currentTime / duration * 100)}%` : '0%';
  return <div className={`book-audio-player ${playing ? 'is-playing' : ''}`} lang="es" dir="ltr" aria-label="Reproductor de audio en español" style={{ '--audio-progress': progress }}>
    <audio ref={audioRef} src={track.src} preload="metadata" onPlay={() => { setPlaying(true); setError(''); }} onPause={() => setPlaying(false)} onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onDurationChange={event => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime || 0)} onEnded={event => { setPlaying(false); setCurrentTime(event.currentTarget.currentTime || duration); }} onError={() => setError('مش قادرين نشغّل التسجيل دلوقتي.')} />
    <div className="book-audio-top"><span className="player-art" aria-hidden="true"><AudioLines size={25}/><i/></span><div className="player-track-copy"><small>ESCUCHA · {track.variant === 'alternativa' ? 'VERSIÓN ALTERNATIVA' : `PISTA ${track.id}`}</small><b lang="es" dir="ltr">{track.title}</b></div><span className="player-live-indicator" lang="ar" dir="rtl"><i/>{playing ? 'شغّال' : 'جاهز للاستماع'}</span></div>
    <div className="player-waveform" aria-hidden="true">{Array.from({ length: 40 }, (_, index) => <i key={index} className={index / 40 * 100 <= parseFloat(progress) ? 'passed' : ''} style={{ '--wave-height': `${18 + ((index * 37 + 19) % 68)}%`, '--bar-delay': `${(index % 9) * -0.08}s` }}/>)}</div>
    <div className="book-audio-seek"><span>{timeLabel(currentTime)}</span><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={event => { if (audioRef.current) { audioRef.current.currentTime = Number(event.target.value); setCurrentTime(Number(event.target.value)); } }} aria-label="البحث في التسجيل" disabled={!duration}/><span>{timeLabel(duration)}</span></div>
    <div className="book-audio-controls player-controls"><button className="player-skip player-skip-back" onClick={() => skip(-10)} aria-label="ارجع عشر ثوانٍ"><RotateCcw size={25}/><span>10</span></button><button className="player-play-button" onClick={toggle} aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل التسجيل'}>{playing ? <Pause size={23} fill="currentColor"/> : <Play size={23} fill="currentColor"/>}</button><button className="player-skip player-skip-forward" onClick={() => skip(10)} aria-label="تقدم عشر ثوانٍ"><RotateCcw size={25}/><span>10</span></button><div className="book-audio-rates" aria-label="سرعة الاستماع">{[0.75, 1, 1.25, 1.5].map(value => <button key={value} className={rate === value ? 'selected' : ''} onClick={() => changeRate(value)} aria-pressed={rate === value}>{value}×</button>)}</div></div>
    {onPanelChange && <div className="player-study-actions" dir="rtl"><span>كمل مذاكرتك</span><div><button type="button" className={activePanel === 'transcript' ? 'selected' : ''} onClick={() => onPanelChange(activePanel === 'transcript' ? null : 'transcript')} disabled={!hasTranscript} aria-pressed={activePanel === 'transcript'}><Captions size={18}/> التفريغ والترجمة</button><button type="button" className={activePanel === 'summary' ? 'selected' : ''} onClick={() => onPanelChange(activePanel === 'summary' ? null : 'summary')} disabled={!hasSummary} aria-pressed={activePanel === 'summary'}><BookOpen size={18}/> الملخص بالعربي</button><button type="button" className={activePanel === 'exercises' ? 'selected' : ''} onClick={() => onPanelChange(activePanel === 'exercises' ? null : 'exercises')} disabled={!hasExercises} aria-pressed={activePanel === 'exercises'}><ListChecks size={18}/> أسئلة الاستماع</button></div></div>}
    {error && <small className="book-audio-error" role="status" dir="rtl">{error}</small>}
  </div>;
}
function nativeBookUnitForLesson(id) {
  const match = /^(A1)-(\d+)$/.exec(id || '');
  return match ? `u${Number(match[2])}` : null;
}
function nativeListeningTrackForLesson(id, track) {
  const course = courseForLesson(id);
  const stage = bookActivities.stages?.[course];
  if (!stage || !track?.src) return null;
  const filename = track.src.split('/').pop();
  return stage.listen.tracks.find(item => item.file === filename) || null;
}
function BidiText({ children, className = '' }) {
  const text = String(children ?? '');
  const spanish = isSpanishText(text);
  return <bdi className={`bidi-isolate ${className}`} lang={spanish ? 'es' : 'ar'} dir={spanish ? 'ltr' : 'rtl'}>{children}</bdi>;
}
function ListeningExplanation({ text = '' }) {
  return <>{text.split(/(\[\[[^\]]+\]\])/u).map((part, index) => part.startsWith('[[') && part.endsWith(']]') ? <bdi key={index} className="bidi-isolate answer-spanish-inline" lang="es" dir="ltr">{part.slice(2, -2)}</bdi> : part)}</>;
}
function NativeListeningExercises({ track, showPageReference = true }) {
  const [answers, setAnswers] = useState({});
  useEffect(() => setAnswers({}), [track?.file]);
  if (!track?.q?.length) return null;
  return <section className="native-listening-exercises"><div className="native-activity-heading"><span className="eyebrow"><Headphones size={14}/> نشاط الاستماع الأصلي</span><b>{track.q.length} أسئلة{showPageReference && track.page ? ` · صفحة ${track.page}` : ''}</b></div>
    {track.q.map((item, index) => <article className="native-listening-question" key={`${track.file}-${index}`}><h4 lang={isSpanishText(item.q) ? 'es' : 'ar'} dir={isSpanishText(item.q) ? 'ltr' : 'rtl'}><BidiText>{item.q}</BidiText></h4><div className="native-listening-options">{item.opts.map((option, choice) => <button key={option} lang={isSpanishText(option) ? 'es' : 'ar'} dir={isSpanishText(option) ? 'ltr' : 'rtl'} className={`${answers[index] === choice ? (choice === item.a ? 'is-correct' : 'is-wrong') : ''} ${answers[index] !== undefined && choice === item.a ? 'is-correct' : ''}`} onClick={() => setAnswers(value => ({ ...value, [index]: choice }))} disabled={answers[index] !== undefined}><BidiText>{option}</BidiText></button>)}</div>{answers[index] !== undefined && <p className="native-listening-feedback">{answers[index] === item.a ? 'صحيح — ' : 'الإجابة من ملف الكتاب: '}<ListeningExplanation text={item.ex}/></p>}</article>)}</section>;
}

function OriginalListeningStation({ lessonId }) {
  const material = courseBookMaterials[lessonId];
  const [trackIndex, setTrackIndex] = useState(0);
  const [activePanel, setActivePanel] = useState(null);
  useEffect(() => { setTrackIndex(0); setActivePanel(null); }, [lessonId]);
  if (!material?.tracks?.length) return <div className="empty-state">مفيش تسجيلات أصلية متاحة للمحاضرة دي.</div>;
  const track = material.tracks[trackIndex] || material.tracks[0];
  const sourceTrack = nativeListeningTrackForLesson(lessonId, track);
  const spanishTranscriptLines = transcriptSegments(sourceTrack?.es || '', sourceTrack?.file || '');
  const arabicTranscriptLines = listeningArabicTranscripts[sourceTrack?.file]?.split('\n') || [];
  const hasLineAlignedTranslation = Boolean(listeningArabicTranscripts[sourceTrack?.file] && spanishTranscriptLines.length > 0 && spanishTranscriptLines.length === arabicTranscriptLines.length);
  return <section className="listening-station">
    <header className="listening-station-head"><div className="station-heading-copy"><span className="eyebrow"><AudioLines size={16}/><b className="station-track-count" lang="es" dir="ltr">{material.tracks.length} PISTAS</b></span><h3 lang="es" dir="ltr">{material.title}</h3><p>{material.unit}</p></div><span className="listening-station-badge"><span className="station-flag-mark" aria-hidden="true"><i/><i/><i/></span><span>من صوتيات الكتاب</span></span></header>
    <div className="listening-playlist"><div className="listening-playlist-head"><div><span className="playlist-mark"><Headphones size={16}/></span><b>قائمة الاستماع</b><small>اختار التسجيل اللي تحب تسمعه</small></div><span lang="es" dir="ltr">{String(trackIndex + 1).padStart(2, '0')} / {String(material.tracks.length).padStart(2, '0')}</span></div><div className="listening-track-list" role="tablist" aria-label="اختيار التسجيل">{material.tracks.map((item, index) => <button key={`${item.id}-${item.variant}-${item.src}`} type="button" role="tab" aria-selected={trackIndex === index} className={trackIndex === index ? 'selected' : ''} onClick={() => { setTrackIndex(index); setActivePanel(null); }}><small>PISTA {item.id}{item.variant === 'alternativa' ? ' · ALT' : ''}</small><b lang="es" dir="ltr">{item.title}</b></button>)}</div></div>
    <BookAudioPlayer key={track.src} track={track} activePanel={activePanel} onPanelChange={setActivePanel} hasTranscript={Boolean(sourceTrack?.es && listeningArabicTranscripts[sourceTrack.file])} hasSummary={Boolean(sourceTrack?.ar)} hasExercises={Boolean(sourceTrack?.q?.length)}/>
    {sourceTrack && activePanel === 'transcript' && <section className="native-audio-transcript listening-tool-panel">
      <header><span>TRANSCRIPCIÓN · التفريغ والترجمة</span></header>
      <div className="transcript-column-heads" dir="ltr"><span lang="es" dir="ltr">ESPAÑOL · النص الأصلي</span><span lang="ar" dir="rtl">العربية · الترجمة الكاملة</span></div>
      {hasLineAlignedTranslation ? <div className="transcript-pair transcript-paired-rows" dir="ltr">{spanishTranscriptLines.map((line, index) => <div className="transcript-row" key={`${sourceTrack.file}-${index}`}><p lang="es" dir="ltr">{line}</p><p lang="ar" dir="rtl">{arabicTranscriptLines[index]}</p></div>)}</div> : <p className="transcript-unavailable" lang="ar" dir="rtl">الترجمة العربية الكاملة لهذا التسجيل غير متاحة بعد.</p>}
    </section>}
    {sourceTrack && activePanel === 'summary' && <section className="listening-tool-panel listening-summary-panel" lang="ar" dir="rtl"><header><span>RESUMEN · الملخص بالعربي</span></header><p>{sourceTrack.ar || 'لا يوجد ملخص عربي لهذا التسجيل.'}</p></section>}
    {sourceTrack && activePanel === 'exercises' && <div className="listening-tool-panel exercises-tool-panel"><NativeListeningExercises track={sourceTrack} showPageReference={false}/></div>}
  </section>;
}

function BookLessonMaterials({ lessonId, mode = 'lesson' }) {
  const material = courseBookMaterials[lessonId];
  const [pageIndex, setPageIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  useEffect(() => { setPageIndex(0); setTrackIndex(0); }, [lessonId]);
  if (!material) return null;
  const page = material.pages[pageIndex] || material.pages[0];
  const track = material.tracks[trackIndex] || material.tracks[0];
  const originalTrack = nativeListeningTrackForLesson(lessonId, track);
  const materialSpanishLines = transcriptSegments(originalTrack?.es || '', originalTrack?.file || '');
  const materialArabicLines = listeningArabicTranscripts[originalTrack?.file]?.split('\n') || [];
  const materialHasFullTranslation = Boolean(listeningArabicTranscripts[originalTrack?.file] && materialSpanishLines.length > 0 && materialSpanishLines.length === materialArabicLines.length);
  function selectTrack(event) {
    const index = Number(event.target.value);
    setTrackIndex(index);
    const targetPage = material.tracks[index]?.page;
    const match = material.pages.findIndex(item => item.page === targetPage);
    if (match >= 0) setPageIndex(match);
  }
  return <section className={`book-material-card ${mode === 'listening' ? 'book-listening-card' : ''}`} aria-label="مواد الدرس من الكتاب">
    <div className="book-material-heading"><span className="book-material-icon"><BookOpen size={17}/></span><div><span className="book-material-kicker">{mode === 'listening' ? 'استماع من الكتاب' : 'مادة المحاضرة'}</span><h3 lang="es" dir="ltr">{material.title}</h3><small>{material.book} · {material.unit}</small></div></div>
    <div className="book-material-selectors"><label><span>المقطع الصوتي</span><BidiSelect value={trackIndex} onChange={selectTrack} options={material.tracks.map((item, index) => ({ value: index, label: `${item.title} · ${item.id}${item.variant === 'alternativa' ? ' (alternativa)' : ''}` }))}/></label><label><span>صفحة الكتاب</span><BidiSelect value={pageIndex} onChange={event => setPageIndex(Number(event.target.value))} options={material.pages.map((item, index) => ({ value: index, label: `صفحة ${item.page}` }))}/></label></div>
    {page && <figure className="book-page-preview"><img src={page.src} alt={`صفحة ${page.page} من كتاب ${material.book}`} loading="lazy"/><figcaption>صفحة {page.page} · {material.book}</figcaption></figure>}
    {track && <BookAudioPlayer key={track.src} track={track}/>}
    {originalTrack && <>
      <details className="native-audio-transcript">
        <summary>التفريغ الإسباني والترجمة العربية الكاملة</summary>
        <div className="transcript-column-heads" dir="ltr"><span lang="es" dir="ltr">ESPAÑOL · النص الأصلي</span><span lang="ar" dir="rtl">العربية · الترجمة الكاملة</span></div>
        {materialHasFullTranslation ? <div className="transcript-pair transcript-paired-rows" dir="ltr">{materialSpanishLines.map((line, index) => <div className="transcript-row" key={`${originalTrack.file}-${index}`}><p lang="es" dir="ltr">{line}</p><p lang="ar" dir="rtl">{materialArabicLines[index]}</p></div>)}</div> : <p className="transcript-unavailable" lang="ar" dir="rtl">الترجمة العربية الكاملة لهذا التسجيل غير متاحة بعد.</p>}
      </details>
      {originalTrack.ar && <details className="native-audio-transcript listening-summary-panel"><summary>الملخص بالعربي</summary><p lang="ar" dir="rtl">{originalTrack.ar}</p></details>}
      <NativeListeningExercises track={originalTrack}/>
    </>}
  </section>;
}
function SpanishLessonPicker({ lessons, value, onChange, label = 'المحاضرة', ariaLabel = 'اختيار المحاضرة', className = '', disabled = false }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const selected = lessons.find(item => item.id === value) || lessons[0];
  const titleOf = lesson => lesson.heading.replace(/^A[12](?:\.\d)? · /, '');
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = event => { if (!pickerRef.current?.contains(event.target)) setOpen(false); };
    const closeOnEscape = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [open]);
  return <div className={`listening-lesson-picker ${className}`.trim()} ref={pickerRef}>
    <span className="listening-lesson-picker-label">{label}</span>
    <button type="button" className="listening-lesson-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(state => !state)} disabled={disabled}>
      <span className="listening-lesson-current" lang="es" dir="ltr">{titleOf(selected)}</span><ChevronDown size={18}/>
    </button>
    {open && !disabled && <div className="listening-lesson-menu" role="listbox" aria-label={ariaLabel}>{lessons.map(lesson => <button type="button" role="option" aria-selected={selected?.id === lesson.id} key={lesson.id} onClick={() => { onChange(lesson.id); setOpen(false); }}><span lang="es" dir="ltr">{titleOf(lesson)}</span>{selected?.id === lesson.id && <Check size={16}/>}</button>)}</div>}
  </div>;
}
function BookListeningLibrary({ stage, focusLessonId }) {
  const lessons = currentLessons(stage).filter(lesson => courseBookMaterials[lesson.id]);
  const initialId = lessons.some(item => item.id === focusLessonId) ? focusLessonId : lessons[0]?.id || '';
  const [lessonId, setLessonId] = useState(initialId);
  useEffect(() => { setLessonId(lessons.some(item => item.id === focusLessonId) ? focusLessonId : lessons[0]?.id || ''); }, [stage, focusLessonId]);
  if (!lessons.length) return null;
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  return <section className="book-listening-library"><div className="book-listening-library-head"><div><span className="eyebrow"><Headphones size={15}/> تسجيلات الكتاب</span><h2>اختار درسًا وابدأ الاستماع</h2><p>كل تسجيل معه تحكّم واضح، وتفريغ أو أسئلة حسب البيانات الأصلية المتاحة.</p></div><SpanishLessonPicker lessons={lessons} value={lesson.id} onChange={setLessonId}/></div><OriginalListeningStation key={lesson.id} lessonId={lesson.id}/></section>;
}
function OriginalBookActivityFlow({ stage, exam = false, focusLessonId, onNavigate }) {
  const lessons = currentLessons(stage);
  const startId = lessons.some(item => item.id === focusLessonId) ? focusLessonId : lessons[0]?.id || '';
  const [lessonId, setLessonId] = useState(startId);
  useEffect(() => { setLessonId(lessons.some(item => item.id === focusLessonId) ? focusLessonId : lessons[0]?.id || ''); }, [stage, focusLessonId]);
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  return <div className="original-book-activity-flow no-page-activity-flow">
    <section className="course-page-intro assessment-intro"><span className="eyebrow">{exam ? <Award size={15}/> : <CircleHelp size={15}/>} {exam ? 'الامتحان الختامي' : 'تدريب Quiz'} · {stage}</span><h2>{exam ? `امتحان ${stage}` : `كويز ${stage}`}</h2><p>مساحة تقييم مستقلة: بنستخدم الأسئلة الرقمية الموثّقة فقط، من غير صور صفحات أو قارئ كتاب داخل الأداة.</p><label className="course-select"><span>اختار المحاضرة</span><BidiSelect value={lesson?.id || ''} onChange={event => setLessonId(event.target.value)} options={lessons.map(item => ({ value: item.id, label: item.heading }))}/></label></section>
    <section className="activity-source-empty assessment-empty" aria-live="polite"><div className="activity-source-empty-icon">{exam ? <Award size={26}/> : <CircleHelp size={26}/>}</div><span className="eyebrow">{lesson?.heading.replace(/^A[12](?:\.\d)? · /, '')}</span><h3>{exam ? 'نموذج الامتحان غير متاح رقميًا بعد' : 'بنك الأسئلة غير متاح رقميًا بعد'}</h3><p>محتوى الأسئلة الأصلي للمستوى {stage} غير موجود بصيغة رقمية موثّقة في المشروع. لن نعرض صفحات الكتاب هنا أو ننشئ أسئلة بديلة وننسبها إليه.</p><span className="activity-source-status"><CheckCircle2 size={17}/> مصدر موثّق فقط · دون محتوى مخمّن</span><div className="assessment-alternatives"><span>تقدر تراجع نفس المحاضرة بأدوات تفاعلية مستقلة:</span><button type="button" onClick={() => onNavigate?.('grammar')}><BookOpen size={18}/> مراجعة القاعدة</button><button type="button" onClick={() => onNavigate?.('flashcards')}><Bookmark size={18}/> بطاقات المفردات</button><button type="button" onClick={() => onNavigate?.('games')}><Gamepad2 size={18}/> ألعاب المحاضرة</button></div></section>
  </div>;
}

function grammarPracticeParts(text = '') {
  const answerAt = text.search(/\s(?:الإجابة:|الإجابة =|=)\s*/u);
  if (answerAt < 0) return { prompt: text, answer: '' };
  const separator = text.slice(answerAt).match(/^\s(?:الإجابة:|الإجابة =|=)\s*/u)?.[0] || '';
  return { prompt: text.slice(0, answerAt).trim(), answer: text.slice(answerAt + separator.length).trim() };
}
const grammarInlinePattern = /(\[\[[^\]]+\]\]|[«“"'‘(]?(?:¿|¡)?\p{Script=Latin}[\p{Script=Latin}\p{M}\p{N}'’.-]*(?:\s+\p{Script=Latin}[\p{Script=Latin}\p{M}\p{N}'’.-]*)*(?:[?!.…,:;]+)?[»”"'’)]?)/gu;
function GrammarText({ text = '' }) {
  return <>{String(text).split(grammarInlinePattern).map((part, index) => {
    if (!part) return null;
    const marked = part.startsWith('[[') && part.endsWith(']]');
    const content = marked ? part.slice(2, -2) : part;
    if (!content.trim()) return part;
    const spanish = marked || /\p{Script=Latin}/u.test(content);
    return spanish
      ? <bdi key={index} className={`grammar-explanation-spanish${marked ? ' grammar-explanation-spanish-explicit' : ''}`} lang="es" dir="ltr">{content}</bdi>
      : <span key={index} className="grammar-explanation-arabic" lang="ar" dir="rtl">{part}</span>;
  })}</>;
}
function GrammarPage({ stage, focusLessonId }) {
  const allLessons = currentLessons(stage);
  const lessons = focusLessonId ? allLessons.filter(lesson => lesson.id === focusLessonId) : allLessons;
  const [revealed, setRevealed] = useState({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [masteryByStage, setMasteryByStage] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hola-grammar-mastery') || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem('hola-grammar-mastery', JSON.stringify(masteryByStage)); } catch { /* storage is optional */ }
  }, [masteryByStage]);
  const masteredIds = Array.isArray(masteryByStage[stage]) ? masteryByStage[stage] : [];
  const mastered = new Set(masteredIds);
  const guides = lessons.map(lesson => ({
    lesson,
    guide: grammarGuides[lesson.id] || { title: lesson.grammar || 'قاعدة الدرس', explanation: lesson.grammar || '', examples: [[lesson.example, lesson.translation]], practice: lesson.question },
    topics: grammarDetails[lesson.id] || [],
  }));
  const exampleCount = guides.reduce((total, item) => total + item.guide.examples.length, 0);
  const topicCount = guides.reduce((total, item) => total + item.topics.length, 0);
  const completedCount = lessons.filter(lesson => mastered.has(lesson.id)).length;
  const visibleGuides = guides.filter(({ lesson, guide, topics }) => {
    const isMastered = mastered.has(lesson.id);
    const matchesFilter = filter === 'all' || (filter === 'mastered' ? isMastered : !isMastered);
    const topicText = topics.flatMap(topic => [topic.title, topic.es, topic.ar, topic.note]);
    const haystack = [lesson.heading, guide.title, guide.explanation, guide.practice, ...guide.examples.flat(), ...topicText].join(' ').toLocaleLowerCase();
    return matchesFilter && (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase()));
  });
  function toggleMastery(lessonId) {
    setMasteryByStage(value => {
      const current = new Set(value[stage] || []);
      if (current.has(lessonId)) current.delete(lessonId); else current.add(lessonId);
      return { ...value, [stage]: [...current] };
    });
  }
  const filters = [
    { id: 'all', label: 'كل القواعد', count: lessons.length },
    { id: 'review', label: 'للمراجعة', count: lessons.length - completedCount },
    { id: 'mastered', label: 'متقنة', count: completedCount },
  ];
  return <div className="grammar-page grammar-studio">
    <section className="grammar-hero">
      <div className="grammar-hero-copy">
        <span className="grammar-studio-kicker"><Sparkles size={15}/> GRAMMAR STUDIO <i/> {stage}</span>
        <h2>{focusLessonId ? 'جرامر المحاضرة' : `قواعد ${stage} — افهمها وطبّقها`}</h2>
        <div className="grammar-hero-stats">
          <div><span>دروس</span><b>{lessons.length}</b></div>
          <div><span>محاور فرعية</span><b>{topicCount}</b></div>
          <div><span>أمثلة مترجمة</span><b>{exampleCount}</b></div>
          <div><span>متقنة</span><b>{completedCount}<small> / {lessons.length}</small></b></div>
        </div>
        <div className="grammar-progress-track" role="progressbar" aria-label="تقدم إتقان القواعد" aria-valuemin="0" aria-valuemax={Math.max(lessons.length, 1)} aria-valuenow={completedCount}><i style={{ width: `${lessons.length ? completedCount / lessons.length * 100 : 0}%` }}/></div>
      </div>
      <div className="grammar-hero-art" aria-hidden="true"><span>GRAMÁTICA</span><b>¿?</b><i>ABC</i><em>¡</em></div>
    </section>
    <section className="grammar-study-toolbar" aria-label="البحث والتصفية في القواعد">
      <label className="grammar-search"><Search size={19}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث في القواعد أو الأمثلة الإسبانية" aria-label="ابحث في قواعد الجرامر"/>{query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={16}/></button>}</label>
      <div className="grammar-filter-tabs" role="group" aria-label="تصفية القواعد">{filters.map(item => <button type="button" key={item.id} className={filter === item.id ? 'selected' : ''} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}><span>{item.label}</span><b>{item.count}</b></button>)}</div>
    </section>
    <div className="grammar-guide-list">
      {visibleGuides.map(({ lesson, guide, topics }, index) => {
        const practice = grammarPracticeParts(guide.practice);
        const isMastered = mastered.has(lesson.id);
        return <article className={`grammar-guide ${isMastered ? 'is-mastered' : ''}`} key={lesson.id}>
          <header className="grammar-guide-head">
            <span className="grammar-guide-index"><b>{String(index + 1).padStart(2, '0')}</b><small>RULE</small></span>
            <div className="grammar-guide-heading-copy">
              <div className="grammar-guide-meta"><span className="level-pill">{stage}</span><small lang="es" dir="ltr">{lesson.heading.replace(/^A[12](?:\.\d)? · /, '')}</small></div>
              <h3>{guide.title}</h3>
            </div>
            <button type="button" className={`grammar-mastery-button ${isMastered ? 'selected' : ''}`} aria-pressed={isMastered} onClick={() => toggleMastery(lesson.id)}><CheckCircle2 size={17}/><span>{isMastered ? 'متقنة' : 'علّمتها كمتقنة'}</span></button>
          </header>
          <div className="grammar-explanation"><GrammarText text={guide.explanation}/></div>
          {topics.length > 0 && <section className="grammar-focus-panel" aria-label={`محاور إضافية: ${guide.title}`}>
            <div className="grammar-section-heading"><div><span className="grammar-section-icon"><ListChecks size={16}/></span><h4>محاور القاعدة</h4></div><small>{topics.length} نقاط أساسية</small></div>
            <div className="grammar-focus-grid">{topics.map((topic, topicIndex) => <article className="grammar-focus-card" key={`${lesson.id}-topic-${topicIndex}`}>
              <div className="grammar-focus-card-head"><span>{String(topicIndex + 1).padStart(2, '0')}</span><h5>{topic.title}</h5></div>
              <bdi className="grammar-focus-spanish" lang="es" dir="ltr">{topic.es}</bdi>
              <p className="grammar-focus-arabic" lang="ar" dir="rtl">{topic.ar}</p>
              <small>{topic.note}</small>
            </article>)}</div>
          </section>}
          <section className="grammar-examples" aria-label={`أمثلة مترجمة: ${guide.title}`}>
            <div className="grammar-section-heading"><div><span className="grammar-section-icon"><AudioLines size={16}/></span><h4>أمثلة مترجمة</h4></div><small>إسباني يسار · عربي يمين</small></div>
            <div className="grammar-example-list">{guide.examples.map(([es, ar], exampleIndex) => <div className="grammar-example-row" key={`${lesson.id}-${es}`}><span className="grammar-example-number">{String(exampleIndex + 1).padStart(2, '0')}</span><b lang="es" dir="ltr">{es}</b><span dir="rtl" lang="ar">{ar}</span><button type="button" onClick={() => speakSpanish(es)} aria-label={`اسمع المثال الإسباني: ${es}`} title="استمع للمثال"><Volume2 size={17}/></button></div>)}</div>
          </section>
          <section className="grammar-practice" aria-label="تطبيق سريع">
            <span className="grammar-practice-icon"><Lightbulb size={19}/></span>
            <div className="grammar-practice-content"><div className="grammar-practice-heading"><b>تحدّي سريع</b><small>طبّق القاعدة بنفسك</small></div><p><GrammarText text={practice.prompt}/></p>
              {practice.answer && <><button className="grammar-reveal-button" type="button" aria-expanded={Boolean(revealed[lesson.id])} onClick={() => setRevealed(value => ({ ...value, [lesson.id]: !value[lesson.id] }))}>{revealed[lesson.id] ? <><Check size={16}/> إخفاء الحل</> : <><Sparkles size={16}/> اكشف الحل</>}</button>{revealed[lesson.id] && <strong className="grammar-practice-answer"><span className="grammar-answer-label">الإجابة</span><div className="grammar-answer-copy"><GrammarText text={practice.answer}/></div></strong>}</>}
            </div>
          </section>
        </article>;
      })}
      {!visibleGuides.length && <section className="grammar-empty-state"><Search size={24}/><b>مفيش قاعدة مطابقة</b><span>جرّب كلمة تانية أو اعرض كل القواعد.</span><button type="button" onClick={() => { setQuery(''); setFilter('all'); }}>إظهار كل القواعد</button></section>}
    </div>
  </div>;
}
function ListeningPage({ stage, focusLessonId }) {
  return <div className="listening-page original-listening-page spanish-sound-page">
    <section className="listening-intro spanish-listening-hero"><div className="listening-hero-copy"><span className="spanish-listening-kicker"><i/> ESPAÑOL · ESCUCHA <b>🇪🇸</b></span><h2>اسمع الإسباني <span>بصوته الأصلي</span></h2><p>اختار تسجيلًا من كتابك، اسمعه بالسرعة المناسبة، وافتح التفريغ أو أسئلة الفهم بضغطة واحدة.</p></div><div className="spanish-hero-art" aria-hidden="true"><span className="spanish-disc"><i>¡</i></span><span className="hero-sound-mark">HOLA<br/><b>¡ESCUCHA!</b></span><span className="hero-sun">✳</span></div></section>
    <BookListeningLibrary stage={stage} focusLessonId={focusLessonId}/>
  </div>;
}
function SpeakingPage({ stage, focusLessonId }) {
  const lessons = currentLessons(stage);
  const startId = lessons.some(item => item.id === focusLessonId) ? focusLessonId : lessons[0]?.id || '';
  const [lessonId, setLessonId] = useState(startId);
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [status, setStatus] = useState('اسمع نموذج القصة، وبعدها اقرأها كاملة بالإسباني.');
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  const story = lessonStories[lessonId] || { title: lesson?.heading || '', sentences: [{ es: lesson?.example || '', ar: lesson?.translation || '' }] };
  const storySentences = story.sentences?.length ? story.sentences : [{ es: lesson?.example || '', ar: lesson?.translation || '' }];
  const fullStoryText = storySentences.map(sentence => sentence.es).filter(Boolean).join(' ');

  useEffect(() => {
    setLessonId(lessons.some(item => item.id === focusLessonId) ? focusLessonId : lessons[0]?.id || '');
    setTranscript('');
    latestTranscriptRef.current = '';
    setEvaluation(null);
    setStatus('اسمع نموذج القصة، وبعدها اقرأها كاملة بالإسباني.');
  }, [stage, focusLessonId]);
  useEffect(() => () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onend = null;
    recognition.onerror = null;
    try { recognition.abort(); } catch { /* recognition may already have stopped */ }
  }, []);

  function selectLesson(nextId) {
    if (recognitionRef.current) {
      const activeRecognition = recognitionRef.current;
      recognitionRef.current = null;
      activeRecognition.onresult = null;
      activeRecognition.onend = null;
      activeRecognition.onerror = null;
      try { activeRecognition.abort(); } catch { /* recognition may already have stopped */ }
      setIsListening(false);
    }
    setLessonId(nextId);
    setTranscript('');
    latestTranscriptRef.current = '';
    setEvaluation(null);
    setStatus('اسمع نموذج القصة، وبعدها اقرأها كاملة بالإسباني.');
  }
  function startRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setStatus('المتصفح الحالي لا يدعم التعرّف الصوتي. جرّب Chrome أو Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    let recognitionError = '';
    recognitionRef.current = recognition;
    latestTranscriptRef.current = '';
    setTranscript('');
    setEvaluation(null);
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setStatus('بسمعك دلوقتي… اقرأ القصة كلها، وبعد ما تخلص اضغط «إنهاء القراءة».');
    };
    recognition.onerror = event => {
      recognitionError = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'اسمح للمتصفح باستخدام الميكروفون وجرّب تاني.'
        : event.error === 'no-speech'
          ? 'ما سمعتش كلام؛ قرّب من الميكروفون وجرّب تاني.'
          : 'ماقدرتش أتعرف على الصوت بوضوح. راجع اتصالك وإذن الميكروفون وحاول تاني.';
      setIsListening(false);
      setStatus(recognitionError);
    };
    recognition.onresult = event => {
      const spoken = Array.from(event.results)
        .map(result => result[0]?.transcript?.trim() || '')
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/gu, ' ')
        .trim();
      latestTranscriptRef.current = spoken;
      setTranscript(spoken);
      setStatus('وصلني كلامك… كمّل القصة، أو اضغط «إنهاء القراءة» لو خلصت.');
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      const spoken = latestTranscriptRef.current.trim();
      if (!spoken) {
        if (!recognitionError) setStatus('ما التقطتش كلام واضح. اسمع النموذج وجرّب تاني.');
        return;
      }
      const result = compareSpanishReading(fullStoryText, spoken);
      setEvaluation(result);
      setStatus(result.exact
        ? 'ممتاز! قريت القصة كاملة، والكلمات اللي اتسمعت مطابقة للنص.'
        : result.accuracy >= 80
          ? `شغل ممتاز، التطابق ${result.accuracy}٪. راجع الكلمات المعلّمة وحاول تاني.`
          : `لسه محتاج تدريب. التطابق الحالي ${result.accuracy}٪؛ اسمع النموذج وجرّب تاني.`);
    };
    setIsListening(true);
    setStatus('بجهّز الميكروفون… اسمح للمتصفح بالتسجيل، وبعدها اقرأ القصة براحتك.');
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setStatus('مش قادر أبدأ التسجيل دلوقتي. اتأكد إن إذن الميكروفون متاح وحاول تاني.');
    }
  }
  function stopRecognition() {
    try { recognitionRef.current?.stop(); }
    catch { setIsListening(false); }
  }
  const verdictLabel = evaluation?.verdict === 'excellent' ? 'ممتاز' : evaluation?.verdict === 'close' ? 'قريب جدًا' : 'محتاج مراجعة';

  return <div className="speaking-page">
    <section className="course-page-intro speaking-intro">
      <span className="eyebrow"><BookOpen size={15}/> قراءة وتحدّث · {stage}</span>
      <h2>قصة الوحدة بالإسباني</h2>
      <p>اسمع القصة كاملة، وبعدها اقرأها بصوتك. هقارن الكلمات اللي التقطها المتصفح بالنص وأوضح لك اللي محتاج مراجعة.</p>
      <SpanishLessonPicker lessons={lessons} value={lessonId} onChange={selectLesson} label="اختار الوحدة" ariaLabel="اختيار وحدة القصة" className="speaking-lesson-picker" disabled={isListening}/>
    </section>
    {lesson && <section className="speaking-story speaking-story-reader" aria-labelledby="speaking-story-title">
      <header className="speaking-story-header">
        <div><span className="story-reading-kicker"><BookOpen size={15}/> قصة الوحدة · {stage}</span><h3 id="speaking-story-title" lang="es" dir="ltr">{story.title || lesson.heading.replace(/^A[12](?:\.\d)? · /, '')}</h3><small>{storySentences.length} جمل · اقرأ القصة كلها للتقييم</small></div>
        <button type="button" className="story-listen-button" onClick={() => speakSpanish(fullStoryText)} disabled={isListening}><Volume2 size={17}/> اسمع نموذج القصة كاملة</button>
      </header>
      <div className="story-bilingual" aria-label={`قصة ${story.title || lesson.heading}`}>
        {storySentences.map((sentence, index) => <article className="story-paired-row" key={`${lessonId}-story-${index}`}>
          <div className="story-line-spanish"><span className="story-line-number">{String(index + 1).padStart(2, '0')}</span><p lang="es" dir="ltr">{sentence.es}</p><button type="button" aria-label={`اسمع الجملة الإسبانية رقم ${index + 1}`} title="اسمع الجملة" onClick={() => speakSpanish(sentence.es)} disabled={isListening}><Volume2 size={15}/></button></div>
          <p className="story-line-arabic" lang="ar" dir="rtl">{sentence.ar}</p>
        </article>)}
      </div>
      {!!lesson.words?.length && <section className="story-vocabulary" aria-label="مفردات الوحدة"><div className="story-vocabulary-heading"><b>مفردات الوحدة</b><small>{lesson.words.length} كلمات</small></div><div className="story-vocabulary-list">{lesson.words.map(word => <div className="story-vocabulary-chip" key={word.es}><bdi lang="es" dir="ltr">{word.es}</bdi><span lang="ar" dir="rtl">{word.ar}</span></div>)}</div></section>}
      <section className="story-practice-panel" aria-labelledby="story-practice-title">
        <div className="story-practice-heading"><span className="eyebrow"><Mic size={14}/> تدريب تفاعلي</span><h4 id="story-practice-title">اقرأ القصة كاملة بصوتك</h4><p>اسمع النموذج بصوت آلي من الزر بالأعلى، وبعدها اقرأ القصة من أولها لآخرها. هراجع اللي اتقال وأعلّم الكلمات اللي فاتتك أو اتسمعت مختلفة.</p></div>
        <div className="story-practice-controls"><button type="button" className={`mic-start story-mic-button ${isListening ? 'recording' : ''}`} onClick={isListening ? stopRecognition : startRecognition} disabled={!supported && !isListening}><Mic size={19}/>{isListening ? 'إنهاء القراءة' : evaluation ? 'اقرأ القصة مرة تانية' : 'ابدأ قراءة القصة'}</button>{isListening && <span className="story-recording-hint" role="status">بسمعك… اقرأ براحتك، وبعدها أنهِ التسجيل.</span>}</div>
        <div className={`speech-feedback story-speech-feedback ${evaluation ? `has-evaluation ${evaluation.verdict}` : ''}`} role="status" aria-live="polite">
          <span className={transcript ? 'feedback-ready' : ''}>{status}</span>
          {evaluation && <div className="story-evaluation">
            <div className="story-evaluation-summary"><strong>{evaluation.accuracy}٪</strong><span>تطابق الكلمات</span><b className={`speech-verdict ${evaluation.verdict}`}>{verdictLabel}</b></div>
            <div className="story-word-legend" aria-label="معاني ألوان التصحيح"><span className="correct">صح</span><span className="wrong">اتسمعت مختلفة</span><span className="missing">فاتتك</span><span className="extra">زيادة</span></div>
            <div className="story-word-comparison" lang="es" dir="ltr" aria-label="مقارنة كلمات القصة">
              {evaluation.words.map((word, index) => <span key={`${index}-${word.expected}-${word.heard}`} className={`story-word-chip ${word.type}`} title={word.type === 'wrong' ? `المطلوب: ${word.expected} · اللي اتسمع: ${word.heard}` : word.type === 'missing' ? `ما اتقالتش: ${word.expected}` : word.type === 'extra' ? `اتسمعت زيادة: ${word.heard}` : 'اتسمعت مطابقة'}>
                {word.type === 'extra' ? <><small>زيادة</small>{word.heard}</> : word.type === 'missing' ? <>{word.expected}<small>فاتتك</small></> : word.type === 'wrong' ? <>{word.expected}<small>اتسمع: {word.heard}</small></> : word.expected}
              </span>)}
            </div>
            <div className="speech-recognized-line"><span>اللي التقطه المتصفح:</span><bdi lang="es" dir="ltr">{transcript}</bdi></div>
          </div>}
        </div>
        <p className="story-practice-note">التقييم تقريبي حسب الكلمات اللي تعرّف عليها المتصفح؛ مش تحليل دقيق لمخارج الحروف، وقد يحتاج إذن الميكروفون واتصالًا بالإنترنت.</p>
      </section>
    </section>}
  </div>;
}
function nativeQuestionsForLesson(lessonId) {
  const stageId = courseForLesson(lessonId);
  const original = bookActivities.stages?.[stageId];
  const unit = nativeBookUnitForLesson(lessonId);
  if (!original || !unit) return [];
  const fromQuiz = (original.quiz?.[unit] || []).map(item => ({ ...item, listening: false }));
  const fromListening = (original.listen?.bank || []).filter(item => item.tunit === unit).map(item => ({ ...item, listening: true }));
  return [...fromQuiz, ...fromListening].map((item, index) => {
    const sourceTrack = item.file ? original.listen.tracks.find(track => track.file === item.file) : null;
    const materialTrack = sourceTrack ? courseBookMaterials[lessonId]?.tracks.find(track => track.src.endsWith(`/${sourceTrack.file}`)) : null;
    const stageAudio = sourceTrack?.file ? `/materials/books/${stageId}/audio/${sourceTrack.file}` : null;
    return {
      id: `${unit}-${item.file || 'quiz'}-${index}-${item.q}`,
      prompt: item.q,
      options: item.opts,
      correct: item.opts[item.a],
      explanation: item.ex,
      source: [item.tag, item.ref].filter(Boolean).join(' · ') || courseBookMaterials[lessonId]?.unit,
      audio: materialTrack?.src || stageAudio,
      listening: Boolean(item.listening),
      spanish: sourceTrack?.es || '',
    };
  });
}
function ExamStartPanel({ stage, model, questionCount, availableCount, onStart }) {
  const questionSummary = questionCount === model?.n
    ? `${questionCount} سؤال`
    : `${questionCount} سؤال متاح من أصل ${model?.n || questionCount}`;
  return <section className="exam-start-panel" aria-labelledby="exam-start-title">
    <span className="eyebrow"><Award size={16}/> تهيئة الامتحان · {stage}</span>
    <h3 id="exam-start-title">راجع الإعدادات قبل ما تبدأ</h3>
    <p>اختار نموذج الكتاب المناسب. مش هيبدأ عرض الأسئلة ولا المؤقّت قبل ضغط زر البداية.</p>
    <div className="exam-start-facts">
      <div><span>النموذج</span><b><bdi lang="es" dir="ltr">{model?.ar || 'امتحان المستوى'}</bdi></b><small lang="es" dir="ltr">{model?.es || ''}</small></div>
      <div><span>عدد الأسئلة</span><b>{questionSummary}</b><small>{availableCount} سؤال موثّق في بنك المرحلة</small></div>
      <div><span>الوقت</span><b>{model?.minutes || 60} دقيقة</b><small>يبدأ بعد الضغط على زر البداية</small></div>
    </div>
    <div className="exam-start-rules"><b>نظام الامتحان</b><ul><li>جاوب أو تخطَّ السؤال؛ كل سؤال عليه درجة واحدة.</li><li>بعد الانتقال للسؤال التالي مش هتقدر ترجع للسابق.</li><li>لو الوقت خلص، النتيجة هتتحسب من الإجابات اللي سجلتها.</li></ul></div>
    <button type="button" className="primary-button exam-start-button" onClick={onStart} disabled={!questionCount}><Play size={17} fill="currentColor"/>{questionCount ? 'ابدأ الامتحان' : 'مفيش أسئلة موثّقة متاحة'}</button>
  </section>;
}
function NativeA1LearningFlow({ stage, exam = false, onFinish, focusLessonId }) {
  const lessons = currentLessons(stage);
  const courseSource = bookActivities.stages?.[stage];
  const models = exam ? (courseSource?.exams?.models || []) : [];
  const focusUnit = nativeBookUnitForLesson(focusLessonId);
  const initialModel = models.find(item => item.unit === focusUnit) || models[0];
  const [lessonId, setLessonId] = useState(focusLessonId || 'all');
  const [modelKey, setModelKey] = useState(initialModel?.k || 'A');
  const model = models.find(item => item.k === modelKey) || models[0];
  const [started, setStarted] = useState(!exam);
  useEffect(() => { setLessonId(focusLessonId || 'all'); setModelKey((models.find(item => item.unit === nativeBookUnitForLesson(focusLessonId)) || models[0])?.k || 'A'); }, [stage, focusLessonId]);
  const modelUnitLesson = exam && model?.unit ? `A1-${Number(model.unit.slice(1))}` : null;
  const effectiveLessonId = exam ? (modelUnitLesson || 'all') : lessonId;
  const pool = useMemo(() => effectiveLessonId === 'all'
    ? lessons.flatMap(lesson => nativeQuestionsForLesson(lesson.id))
    : nativeQuestionsForLesson(effectiveLessonId), [stage, effectiveLessonId]);
  const amount = exam ? Math.min(model?.n || 40, pool.length) : Math.min(8, pool.length);
  const [questions, setQuestions] = useState(() => exam ? [] : drawQuestions(pool, amount));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [responses, setResponses] = useState([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [seconds, setSeconds] = useState(exam ? (model?.minutes || 60) * 60 : 0);
  const finishReported = useRef(false);
  const item = questions[index];
  const choiceDeck = useMemo(() => buildChoiceDeck(questions), [questions]);
  const choices = choiceDeck[index] || [];
  useEffect(() => {
    if (!exam || !started || finished) return undefined;
    const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [exam, started, finished]);
  useEffect(() => {
    if (!exam || !started || finished || seconds > 0) return;
    const nextResponses = [...responses];
    nextResponses[index] = answer;
    setResponses(nextResponses);
    if (answer !== null && answer === item?.correct) setScore(value => value + 1);
    setFinished(true);
  }, [exam, started, finished, seconds, answer, index, item]);
  useEffect(() => {
    if (!finished || finishReported.current) return;
    finishReported.current = true;
    if (questions.length) onFinish(Math.round(score / questions.length * (exam ? 40 : 15)));
  }, [finished]);
  function restart(nextLessonId = lessonId, nextModelKey = modelKey, begin = true) {
    const nextModel = models.find(item => item.k === nextModelKey) || models[0];
    const modelUnit = nextModel?.unit ? `A1-${Number(nextModel.unit.slice(1))}` : null;
    const targetLesson = exam ? (modelUnit || 'all') : nextLessonId;
    const nextPool = targetLesson === 'all' ? lessons.flatMap(lesson => nativeQuestionsForLesson(lesson.id)) : nativeQuestionsForLesson(targetLesson);
    const nextAmount = exam ? Math.min(nextModel?.n || 40, nextPool.length) : Math.min(8, nextPool.length);
    finishReported.current = false;
    setQuestions(drawQuestions(nextPool, nextAmount)); setIndex(0); setAnswer(null); setResponses([]); setScore(0); setFinished(false); setAudioPlayed(false); setSeconds(exam ? (nextModel?.minutes || 60) * 60 : 0); setStarted(exam ? begin : true);
  }
  function next() {
    if (!exam && answer === null) return;
    const nextResponses = [...responses]; nextResponses[index] = answer; setResponses(nextResponses);
    const total = score + (answer === item?.correct ? 1 : 0); setScore(total);
    if (index + 1 === questions.length) { setFinished(true); return; }
    setIndex(value => value + 1); setAnswer(null); setAudioPlayed(false);
  }
  const percentage = questions.length ? Math.round(score / questions.length * 100) : 0;
  const answeredCount = responses.filter(response => response !== null && response !== undefined).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const elapsedSeconds = exam ? Math.max(0, (model?.minutes || 60) * 60 - seconds) : 0;
  return <div className="learning-flow">
    <section className="course-page-intro"><span className="eyebrow">{exam ? <Award size={15}/> : <CircleHelp size={15}/>} {exam ? 'اختبار من ملف الكتاب' : 'تدريب من ملف الكتاب'}</span><h2>{exam ? `امتحان ${stage}` : `Quiz · ${stage}`}</h2><p>{exam ? started ? `النموذج: ${model?.ar || 'مراجعة المرحلة'} · الامتحان شغّال دلوقتي.` : 'اختار نموذج الامتحان واستعد؛ المؤقّت مش هيبدأ غير لما تضغط «ابدأ الامتحان».' : 'الأسئلة مأخوذة من بنك التمارين وأسئلة الاستماع الأصلية للكتاب، بدون أمثلة مُضافة من مكتبة الدروس.'}</p>
      {!finished && (!exam || !started) && <div className="native-learning-selectors">{!exam && <label className="course-select"><span>نطاق الأسئلة</span><BidiSelect value={lessonId} onChange={event => { const nextId = event.target.value; setLessonId(nextId); restart(nextId); }} options={[{ value: 'all', label: `كل وحدات ${stage}` }, ...lessons.map(lesson => ({ value: lesson.id, label: lesson.heading }))]}/></label>}{exam && models.length > 0 && <label className="course-select"><span>نموذج الامتحان من الكتاب</span><BidiSelect value={modelKey} onChange={event => setModelKey(event.target.value)} options={models.map(item => ({ value: item.k, label: `${item.ar} · ${item.n} سؤال` }))}/></label>}</div>}
    </section>
    {exam && !started && !finished ? <ExamStartPanel stage={stage} model={model} questionCount={amount} availableCount={pool.length} onStart={() => restart(lessonId, modelKey, true)}/> : finished ? <section className="flow-result"><div className="result-medal">{percentage >= 70 ? '🏆' : '📘'}</div><span className="eyebrow">{exam ? 'نتيجة الامتحان' : 'نتيجة التدريب'}</span><h3>{score} / {questions.length} إجابات صحيحة</h3>{exam && <div className="exam-result-grid"><div><b>{percentage}٪</b><span>نسبة الصح</span></div><div><b>{answeredCount}</b><span>اتجاوب</span></div><div><b>{unansweredCount}</b><span>من غير إجابة</span></div><div><b>{Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}</b><span>الوقت المستخدم</span></div></div>}<p>{percentage >= 70 ? 'ممتاز! دي إجابتك على أسئلة الكتاب الأصلية.' : 'راجع المحاضرة والتسجيل المرتبط بالسؤال، وبعدها جرّب تاني.'}</p><div className="result-progress"><i style={{ width: `${percentage}%` }} /></div>{exam && <details className="exam-review"><summary>مراجعة الإجابات بعد التسليم</summary><div className="exam-review-list">{questions.map((reviewItem, reviewIndex) => { const submitted = responses[reviewIndex]; const isCorrect = submitted === reviewItem.correct; return <article key={`${reviewItem.prompt}-${reviewIndex}`} className={submitted == null ? 'unanswered' : isCorrect ? 'review-correct' : 'review-wrong'}><div><b>سؤال {reviewIndex + 1}</b><span>{submitted == null ? 'من غير إجابة' : isCorrect ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}</span></div><p><BidiText>{reviewItem.prompt}</BidiText></p><p><span>إجابتك: </span><BidiText>{submitted ?? 'لم تجب'}</BidiText></p><p><span>الإجابة الصحيحة: </span><BidiText>{reviewItem.correct}</BidiText></p>{reviewItem.explanation && <small><ListeningExplanation text={reviewItem.explanation}/></small>}</article>; })}</div></details>}<button className="primary-button" onClick={() => restart(lessonId, modelKey, false)}><RotateCcw size={16}/>{exam ? 'محاولة جديدة' : 'ابدأ محاولة جديدة'}</button></section> : item ? <section className="flow-question-card"><div className="flow-stats"><span>{exam && <><Timer size={15}/> {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')} · </>}<Target size={15}/> سؤال {index + 1} من {questions.length}</span>{!exam && <span><CheckCircle2 size={15}/> النتيجة {score}</span>}</div><div className="flow-progress"><i style={{ width: `${(index + 1) / questions.length * 100}%` }}/></div><small className="flow-source">{item.source}</small><h3 dir={isSpanishText(item.prompt) ? 'ltr' : 'rtl'} lang={isSpanishText(item.prompt) ? 'es' : 'ar'}><BidiText>{item.prompt}</BidiText></h3>{item.audio && <audio className="native-question-audio" controls preload="none" src={item.audio} onEnded={() => setAudioPlayed(true)} onError={() => setAudioPlayed(true)}>المتصفح لا يدعم تشغيل الصوت.</audio>}{item.listening && item.audio && !audioPlayed && <small className="flow-audio-hint">اسمع التسجيل كاملًا قبل ما تجاوب.</small>}<div className="flow-options">{choices.map((option, i) => <button key={`${item.prompt}-${option}`} lang={isSpanishText(option) ? 'es' : 'ar'} dir={isSpanishText(option) ? 'ltr' : 'rtl'} disabled={answer !== null || (item.listening && item.audio && !audioPlayed)} onClick={() => answer === null && setAnswer(option)} className={exam ? answer === option ? 'exam-selected' : '' : `${answer === option ? (option === item.correct ? 'is-correct' : 'is-wrong') : ''} ${answer !== null && option === item.correct ? 'is-correct' : ''}`}><span>{['A','B','C','D'][i]}</span><BidiText>{option}</BidiText>{answer === option && (option === item.correct ? <Check size={17}/> : <X size={17}/>)}</button>)}</div>{answer !== null && !exam && <div className={`flow-feedback ${answer === item.correct ? 'good' : 'bad'}`}>{answer === item.correct ? 'إجابة صحيحة — عاش!' : <>الإجابة الصحيحة: <BidiText>{item.correct}</BidiText></>}{item.explanation && <small><ListeningExplanation text={item.explanation}/></small>}</div>}<button className="primary-button flow-next" disabled={!exam && answer === null} onClick={next}>{answer === null && exam ? index + 1 === questions.length ? 'سلّم الامتحان' : 'تخطَّ السؤال' : index + 1 === questions.length ? exam ? 'إنهاء الامتحان' : 'اعرض النتيجة' : 'السؤال التالي'} <ArrowLeft size={16}/></button></section> : <section className="empty-state">مافيش أسئلة أصلية متاحة للنطاق ده. افتح المحاضرة من خطة التعلّم عشان توصل لصفحاتها وأنشطتها الأصلية.</section>}
  </div>;
}
function LearningFlow({ stage, exam = false, onFinish, focusLessonId, onNavigate }) {
  return stage.startsWith('A1')
    ? <NativeA1LearningFlow stage={stage} exam={exam} onFinish={onFinish} focusLessonId={focusLessonId}/>
    : <OriginalBookActivityFlow stage={stage} exam={exam} focusLessonId={focusLessonId} onNavigate={onNavigate}/>;
}
function GamePromptText({ text = '' }) {
  const value = String(text ?? '');
  const hasArabic = /[\u0600-\u06ff]/u.test(value);
  const hasLatin = /\p{Script=Latin}/u.test(value);
  return hasArabic && hasLatin ? <GrammarText text={value}/> : <BidiText>{value}</BidiText>;
}
function GameRun({ game, lesson, stage, mode, onBack, onFinish, record }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matched, setMatched] = useState([]);
  const [usedTiles, setUsedTiles] = useState([]);
  const [order, setOrder] = useState([]);
  const [lives, setLives] = useState(mode.lives ?? 0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [seconds, setSeconds] = useState(mode.seconds);
  const [feedback, setFeedback] = useState(null);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [roundSeed, setRoundSeed] = useState(0);
  const finishReported = useRef(false);
  const bank = useMemo(() => arcadeBankFor(game.id, stage, lesson), [game.id, stage, lesson.id]);
  const roundCount = Math.min(arcadeRoundLimit(game.id, mode), bank.length);
  const roundBank = useMemo(() => shuffled(bank).slice(0, roundCount), [bank, roundCount, roundSeed]);
  const item = roundBank[index];
  const question = item && typeof item === 'object' ? item : null;
  const matchWords = useMemo(() => game.id === 'match' ? shuffled(roundBank) : [], [game.id, roundBank]);
  const sentenceTokens = useMemo(() => typeof item === 'string' ? shuffled(item.trim().split(/\s+/u)) : [], [item, roundSeed]);
  const choiceDeck = useMemo(() => buildChoiceDeck(roundBank.filter(item => item && typeof item === 'object')), [roundBank]);
  const choices = question ? choiceDeck[index] || [] : [];
  const progressValue = game.id === 'match' ? matched.length : index + 1;
  const accuracy = roundCount ? Math.round(correctCount / roundCount * 100) : 0;
  const rewardXp = Math.min(12, Math.floor(score / 10));
  useEffect(() => {
    if (!mode.timed || finished) return undefined;
    const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [mode.timed, finished]);
  useEffect(() => {
    if (mode.timed && seconds === 0 && !finished) { setFeedback({ text: 'انتهى الوقت.', tone: 'bad' }); setFinished(true); }
  }, [mode.timed, seconds, finished]);
  useEffect(() => {
    if (!finished || finishReported.current) return;
    finishReported.current = true;
    onFinish?.({ score, correctCount, roundCount, accuracy, bestStreak, xp: rewardXp, modeId: mode.id });
  }, [finished]);
  function awardCorrect() {
    const nextStreak = streak + 1;
    const scoring = arcadeScoring[game.id];
    const bonus = nextStreak % scoring.streakEvery === 0 ? scoring.streakBonus : 0;
    const points = Math.round((scoring.base + bonus) * mode.multiplier);
    setScore(value => value + points);
    setCorrectCount(value => value + 1);
    setStreak(nextStreak);
    setBestStreak(value => Math.max(value, nextStreak));
    return points;
  }
  function loseLife() {
    setStreak(0);
    if (mode.lives === null) return;
    const remaining = Math.max(0, lives - 1);
    setLives(remaining);
    if (remaining === 0) { setFeedback({ text: 'خلصت المحاولات.', tone: 'bad' }); setFinished(true); }
  }
  function mark(option) {
    if (selected !== null || !question || (['listen', 'storyListen'].includes(game.id) && !audioPlayed)) return;
    setSelected(option);
    if (option === question.correct) {
      const points = awardCorrect();
      setFeedback({ text: `إجابة مظبوطة! +${points} نقطة`, tone: 'good', detail: question.explanation || question.spanish || '' });
    } else {
      loseLife();
      setFeedback({ text: 'مش هي دي؛ الإجابة الصحيحة موضحة بالأخضر.', tone: 'bad', detail: question.correct });
    }
  }
  function selectMatchArabic(ar) {
    if (!selectedMatch || matched.includes(selectedMatch)) return;
    const pair = matchWords.find(word => word.es === selectedMatch);
    if (pair?.ar === ar) {
      const nextMatched = [...matched, selectedMatch];
      setMatched(nextMatched);
      setSelectedMatch(null);
      const points = awardCorrect();
      setFeedback({ text: `تطابق صحيح! +${points} نقطة`, tone: 'good' });
      if (nextMatched.length === matchWords.length) setFinished(true);
    } else {
      setFeedback({ text: 'مش المعنى المقابل؛ جرّب تاني.', tone: 'bad' });
      loseLife();
      setSelectedMatch(null);
    }
  }
  function checkOrder() {
    const proposed = order.map(tile => sentenceTokens[tile]).join(' ');
    const normalize = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f.,!?¿¡;:]/gu, '').replace(/\s+/gu, ' ').trim();
    const isCorrect = normalize(proposed) === normalize(item);
    setSelected(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      const points = awardCorrect();
      setFeedback({ text: `الجملة مظبوطة! +${points} نقطة`, tone: 'good' });
    } else {
      setFeedback({ text: 'الترتيب مش مظبوط؛ حرّك الكلمات وجرّب تاني.', tone: 'bad' });
      loseLife();
    }
  }
  function next() {
    if (game.id === 'order' && selected !== 'correct') return;
    if (game.id !== 'order' && selected === null) return;
    if (index + 1 >= roundBank.length) { setFinished(true); return; }
    setIndex(value => value + 1);
    setSelected(null); setUsedTiles([]); setOrder([]); setAudioPlayed(false); setFeedback(null);
  }
  function restartRound() {
    finishReported.current = false;
    setRoundSeed(value => value + 1); setIndex(0); setSelected(null); setSelectedMatch(null);
    setMatched([]); setUsedTiles([]); setOrder([]); setAudioPlayed(false); setLives(mode.lives ?? 0); setScore(0); setCorrectCount(0);
    setStreak(0); setBestStreak(0); setSeconds(mode.seconds); setFeedback(null); setFinished(false);
  }
  const percent = roundCount ? Math.min(100, progressValue / roundCount * 100) : 0;
  const showChoices = ['quiz', 'listen', 'storyListen'].includes(game.id);
  return <div className="game-run-page">
    <header className="game-run-top">
      <button className="icon-button" onClick={onBack} aria-label="العودة لصالة الألعاب"><ArrowRight size={18}/></button>
      <div className="game-run-title"><span className="level-pill">{stage}</span><b>{game.title} · <bdi lang="es" dir="ltr">{lesson.heading.split(' · ').at(-1)}</bdi></b><small>{mode.icon} {mode.title}{record?.plays ? ` · أفضل ${record.bestScore} نقطة · دقة ${record.bestAccuracy ?? 0}٪` : ''}</small></div>
      <div className="run-stats">{mode.lives !== null && <span><Heart size={16} fill="currentColor"/> {lives}</span>}{mode.timed && <span><Timer size={16}/> {seconds}s</span>}<span>⚡ {score}</span><span>🔥 {streak}</span></div>
    </header>
    {finished ? <section className="game-result arcade-result">
      <div className="result-medal">{accuracy >= 80 ? '🏆' : accuracy >= 45 ? '🥈' : '💪'}</div>
      <span className="eyebrow">انتهت الجولة · {mode.title}</span>
      <h2>{accuracy >= 80 ? 'أداء ممتاز!' : accuracy >= 45 ? 'جولة حلوة — كمّل!' : 'كل محاولة بتعلّمك'}</h2>
      <div className="arcade-result-score"><b>{score}</b><span>نقطة</span></div>
      <div className="arcade-result-stats"><div><b>{correctCount} / {roundCount}</b><span>إجابات مظبوطة</span></div><div><b>{accuracy}%</b><span>دقة الجولة</span></div><div><b>{bestStreak}</b><span>أطول سلسلة</span></div></div>
      <p>{game.title} · <bdi lang="es" dir="ltr">{lesson.heading.split(' · ').at(-1)}</bdi></p>
      {rewardXp > 0 && <span className="arcade-xp-earned"><Zap size={16}/> كسبت {rewardXp} XP</span>}
      <div className="game-result-actions"><button className="secondary-button" onClick={restartRound}><RotateCcw size={16}/> العب تاني</button><button className="primary-button" onClick={onBack}>ارجع للألعاب <ArrowLeft size={16}/></button></div>
    </section> : !roundBank.length ? <section className="game-board"><h2>البنك مش متاح للجولة دي</h2><p>اختار لعبة أو وحدة تانية.</p><button className="primary-button" onClick={onBack}>العودة للألعاب</button></section> : <section className="game-board arcade-game-board">
      <div className="game-board-heading"><span>{game.icon} <bdi lang="es" dir="ltr">{lesson.heading.split(' · ').at(-1)}</bdi> · {game.id === 'match' ? `${matched.length} / ${roundCount} أزواج` : `سؤال ${index + 1} من ${roundCount}`}</span><div className="game-run-progress" role="progressbar" aria-label="تقدم الجولة" aria-valuemin="0" aria-valuemax={roundCount} aria-valuenow={progressValue}><i style={{ width: `${percent}%` }}/></div></div>
      <p className="game-instructions">{game.instructions}</p><p className="game-scoring-rule"><Sparkles size={14}/><span>نظام نقاط اللعبة: {arcadeScoring[game.id].label}. الوضع الحالي يطبّق مضاعف {mode.multiplier}×.</span></p>
      {game.id === 'match' ? <>
        <h2>اختار الإسباني ومعناه</h2>
        <div className="live-match-grid"><div>{matchWords.map(pair => <div key={pair.es} className={`live-match-choice ${selectedMatch === pair.es ? 'selected' : ''} ${matched.includes(pair.es) ? 'matched' : ''}`}><button className="live-match-text" onClick={() => { if (!matched.includes(pair.es)) { setSelectedMatch(pair.es); setFeedback({ text: 'دلوقتي اختار المعنى بالعربي.', tone: 'neutral' }); } }} disabled={matched.includes(pair.es)} lang="es" dir="ltr">{pair.es}</button><button className="match-sound" onClick={() => speakSpanish(pair.es)} aria-label={`اسمع ${pair.es}`}><Volume2 size={15}/></button></div>)}</div><div>{matchWords.map(pair => <button key={`${pair.es}-ar`} className={`live-match-choice arabic ${matched.includes(pair.es) ? 'matched' : ''}`} onClick={() => selectMatchArabic(pair.ar)} disabled={matched.includes(pair.es)}>{pair.ar}</button>)}</div></div>
      </> : game.id === 'order' ? <>
        <h2>رتّب كلمات الجملة</h2>
        <p className="order-built" lang="es" dir="ltr">{order.map((tile, position) => <button key={`${tile}-${position}`} onClick={() => { setOrder(value => value.filter((_, at) => at !== position)); setUsedTiles(value => value.filter(index => index !== tile)); setSelected(null); }}>{sentenceTokens[tile]}</button>)}</p>
        <div className="order-tiles" lang="es" dir="ltr">{sentenceTokens.map((token, tile) => <button key={`${tile}-${token}`} disabled={usedTiles.includes(tile)} onClick={() => { setUsedTiles(value => [...value, tile]); setOrder(value => [...value, tile]); setSelected(null); }}>{token}</button>)}</div>
        <button className="primary-button game-check-order" onClick={checkOrder} disabled={selected === 'correct' || !order.length}>تحقّق من الترتيب <Check size={16}/></button>
      </> : question ? <>
        <small className="arcade-question-source">{question.source || game.title}</small>
        <h2><GamePromptText text={question.prompt}/></h2>
        {game.id === 'listen' && <p className="game-listen-task">اسمع التسجيل الأصلي، واقرأ السؤال ده، وبعدها اختار الإجابة.</p>}
        {game.id === 'storyListen' && <p className="game-listen-task">اسمع الجملة الإسبانية، ثم جاوب عن السؤال.</p>}
        {game.id === 'listen' && question.audio && <audio className="game-original-audio" controls preload="none" src={question.audio} onEnded={() => setAudioPlayed(true)} onError={() => { setAudioPlayed(true); setFeedback({ text: 'التسجيل مش قادر يشتغل دلوقتي؛ تقدر تجاوب من السؤال المعروض.', tone: 'bad' }); }}>المتصفح لا يدعم تشغيل الصوت.</audio>}
        {game.id === 'storyListen' && <button type="button" className="game-listen-button" onClick={() => { const started = speakSpanish(question.spanish); setAudioPlayed(started); setFeedback(started ? { text: 'اسمع الجملة كويس، وبعدها اختار معناها.', tone: 'neutral' } : { text: 'الصوت الآلي مش متاح في المتصفح؛ تقدر تقرأ الجملة وتجاوب.', tone: 'bad' }); }}><Volume2 size={18}/> اسمع الجملة بالإسباني</button>}
        {game.id === 'quiz' && question.spanish && <p className="game-prompt-spanish" lang="es" dir="ltr"><BidiText>{question.spanish}</BidiText></p>}
        <div className="game-answer-grid">{choices.map((option, choiceIndex) => <button key={`${index}-${option}`} lang={isSpanishText(option) ? 'es' : 'ar'} dir={isSpanishText(option) ? 'ltr' : 'rtl'} disabled={selected !== null || (['listen', 'storyListen'].includes(game.id) && !audioPlayed)} className={`${selected !== null && option === question.correct ? 'is-correct' : ''} ${selected === option && option !== question.correct ? 'is-wrong' : ''}`} onClick={() => mark(option)}><span>{['A', 'B', 'C', 'D'][choiceIndex]}</span><span className="game-answer-copy"><GamePromptText text={option}/></span>{selected === option && (option === question.correct ? <Check size={17}/> : <X size={17}/>)}</button>)}</div>
      </> : null}
      {feedback && <div className={`game-live-feedback ${feedback.tone || ''}`} role="status"><span>{feedback.text}</span>{feedback.detail && <small><GamePromptText text={feedback.detail}/></small>}</div>}
      {showChoices && <button className="game-next-button" disabled={selected === null} onClick={next}>{lives === 0 && mode.lives !== null ? 'اعرض النتيجة' : index + 1 === roundCount ? 'اعرض النتيجة' : 'السؤال التالي'} <ArrowLeft size={16}/></button>}
      {game.id === 'order' && selected === 'correct' && <button className="game-next-button" onClick={next}>{index + 1 === roundCount ? 'اعرض النتيجة' : 'الجملة التالية'} <ArrowLeft size={16}/></button>}
    </section>}
  </div>;
}
function GamesPage({ stage, addXp, focusLessonId }) {
  const lessons = currentLessons(stage);
  const startId = lessons.some(item => item.id === focusLessonId) ? focusLessonId : lessons[0]?.id || '';
  const [lessonId, setLessonId] = useState(startId);
  const [activeGame, setActiveGame] = useState(null);
  const [modeId, setModeId] = useState('practice');
  const [records, setRecords] = useState(loadArcadeRecords);
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  const mode = arcadeModes.find(item => item.id === modeId) || arcadeModes[0];
  useEffect(() => { setLessonId(lessons.some(item => item.id === focusLessonId) ? focusLessonId : lessons[0]?.id || ''); setActiveGame(null); }, [stage, focusLessonId]);
  useEffect(() => { try { localStorage.setItem('hola-arcade-records', JSON.stringify(records)); } catch { /* local progress is optional */ } }, [records]);
  function recordKey(gameId) { return `${stage}|${lessonId}|${gameId}|${modeId}`; }
  function finishGame(game, result) {
    const key = recordKey(game.id);
    setRecords(previous => {
      const old = previous[key] || {};
      return { ...previous, [key]: { plays: (old.plays || 0) + 1, bestScore: Math.max(old.bestScore || 0, result.score), bestAccuracy: Math.max(old.bestAccuracy || 0, result.accuracy), bestStreak: Math.max(old.bestStreak || 0, result.bestStreak), lastScore: result.score, lastPlayed: Date.now() } };
    });
    if (result.xp > 0) addXp(result.xp);
  }
  if (activeGame && lesson) {
    const key = recordKey(activeGame.id);
    return <GameRun key={`${activeGame.id}-${lesson.id}-${mode.id}`} game={activeGame} lesson={lesson} stage={stage} mode={mode} record={records[key]} onBack={() => setActiveGame(null)} onFinish={result => finishGame(activeGame, result)}/>;
  }
  return <div className="arcade-page">
    <section className="games-banner"><div><span className="eyebrow"><Gamepad2 size={15}/> صالة الألعاب · {stage}</span><h2>اختار لعبتك ووحدتك</h2><p>مفردات وقواعد وقصص الوحدة، وكل لعبة ليها تحدّي ونظام نقاط خاص.</p></div><div className="game-emoji">🕹️</div></section>
    <section className="arcade-controls-panel"><div className="arcade-controls"><SpanishLessonPicker lessons={lessons} value={lessonId} onChange={nextId => { setLessonId(nextId); setActiveGame(null); }} label="الوحدة" ariaLabel="اختيار وحدة الألعاب" className="arcade-lesson-picker"/><span className="arcade-selected-lesson">{lesson?.objective}</span></div>
      <div className="arcade-mode-picker" role="group" aria-label="اختار نظام الجولة"><span className="arcade-section-label">نظام الجولة</span><div>{arcadeModes.map(item => <button type="button" key={item.id} className={modeId === item.id ? 'selected' : ''} aria-pressed={modeId === item.id} onClick={() => setModeId(item.id)}><span>{item.icon}</span><b>{item.title}</b><small>{item.description}</small></button>)}</div></div>
    </section>
    <section className="arcade-games-section"><header className="arcade-games-heading"><div><span className="eyebrow" lang="es" dir="ltr">{lesson?.heading.split(' · ').at(-1)}</span><h3>اختار لعبة</h3></div><small>{gameCatalog.filter(game => game.id !== 'listen' || stage.startsWith('A1')).length} ألعاب متاحة · {mode.title}</small></header>
      <div className="arcade-grid">{gameCatalog.filter(game => game.id !== 'listen' || stage.startsWith('A1')).map(game => {
        const bank = arcadeBankFor(game.id, stage, lesson);
        const rounds = Math.min(arcadeRoundLimit(game.id, mode), bank.length);
        const key = recordKey(game.id);
        const record = records[key];
        const bankLabel = game.id === 'match' ? 'أزواج' : game.id === 'order' ? 'جمل' : 'سؤال';
        return <article className={`arcade-game-card ${!bank.length ? 'unavailable' : ''}`} key={game.id}>
          <span className="arcade-game-icon">{game.icon}</span><span className="game-kicker">{stage} · {mode.icon} {mode.title}</span><h3>{game.title}</h3><p>{game.description}</p><small className="arcade-card-rule"><Sparkles size={13}/>{arcadeScoring[game.id].label}</small>
          <div className="arcade-game-meta"><span><Target size={14}/> بنك {bank.length} {bankLabel}</span><span>{rounds} في الجولة</span></div>
          <div className="arcade-game-record">{record ? <><span>أفضل نتيجة <b>{record.bestScore}</b> · أفضل دقة <b>{record.bestAccuracy ?? 0}٪</b></span><small>{record.plays} جولات · أعلى سلسلة {record.bestStreak ?? 0}</small></> : <span>لسه ما لعبتش اللعبة دي</span>}</div>
          <button className="primary-button" disabled={!bank.length} onClick={() => setActiveGame(game)}>{bank.length ? 'ابدأ الجولة' : 'مش متاحة للوحدة'} <Play size={15} fill="currentColor"/></button>
        </article>;
      })}</div>
    </section>
  </div>;
}
function FlashcardsPage({ stage, savedWords, onSaveWord }) {
  const lessons = currentLessons(stage);
  const [lessonId, setLessonId] = useState(lessons[0]?.id || '');
  const [cardKind, setCardKind] = useState('words');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  const sourceStageId = lesson ? courseForLesson(lesson.id) : null;
  const sourceStage = bookActivities.stages?.[sourceStageId];
  const sourceUnitId = lesson ? nativeBookUnitForLesson(lesson.id) : null;
  const unit = sourceStage?.units?.find(item => item.k === sourceUnitId);
  const deck = sourceStage?.flash?.[sourceUnitId];
  const allCards = cardKind === 'sentences' ? (deck?.sentences || []) : (deck?.words || []);
  const cards = allCards.filter(item => !savedOnly || savedWords.includes(item.es));
  const current = cards[index];
  const hasNativeCards = Boolean(deck?.words?.length || deck?.sentences?.length);
  useEffect(() => { setLessonId(currentLessons(stage)[0]?.id || ''); setIndex(0); setFlipped(false); }, [stage]);
  useEffect(() => { setIndex(0); setFlipped(false); }, [lessonId, cardKind, savedOnly]);
  function step(amount) { setIndex(value => (value + amount + cards.length) % cards.length); setFlipped(false); }
  const savedCount = allCards.filter(item => savedWords.includes(item.es)).length;
  return <div className="flashcards-page native-flashcards-page">
    <section className="course-page-intro native-flashcards-intro">
      <span className="eyebrow"><Bookmark size={15}/> مفردات وجمل من ملفات الكتاب الأصلية</span>
      <h2>بطاقات المراجعة</h2>
      <p>الكلمات والجمل مترجمة من مصدر الكتاب نفسه، ومقسّمة حسب الوحدة.</p>
      <div className="native-flashcard-selectors">
        <label className="course-select"><span>المرحلة</span><BidiSelect value={stage} disabled options={[{ value: stage, label: stage }]}/></label>
        <label className="course-select"><span>الوحدة</span><BidiSelect value={lesson?.id || ''} onChange={event => setLessonId(event.target.value)} options={lessons.map(item => ({ value: item.id, label: item.heading.replace(/^A[12](?:\.\d)? · /, '') }))}/></label>
      </div>
      <div className="flashcard-filter native-flashcard-tabs" role="tablist" aria-label="نوع بطاقات المراجعة">
        <button type="button" role="tab" aria-selected={cardKind === 'words'} className={cardKind === 'words' ? 'selected' : ''} onClick={() => setCardKind('words')}>الكلمات ({deck?.words?.length || 0})</button>
        <button type="button" role="tab" aria-selected={cardKind === 'sentences'} className={cardKind === 'sentences' ? 'selected' : ''} onClick={() => setCardKind('sentences')}>الجمل ({deck?.sentences?.length || 0})</button>
        <button type="button" className={savedOnly ? 'selected' : ''} aria-pressed={savedOnly} onClick={() => setSavedOnly(value => !value)}>المحفوظة ({savedCount})</button>
      </div>
    </section>
    {current ? <>
      <div className="flashcard-progress">بطاقة {index + 1} من {cards.length}<button type="button" onClick={() => { setIndex(Math.floor(Math.random() * cards.length)); setFlipped(false); }}><Shuffle size={17}/> اخلط البطاقات</button></div>
      <button type="button" className={`flashcard native-source-flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(value => !value)} aria-label="اقلب البطاقة">
        <span className="flashcard-side-label">{flipped ? 'المعنى بالعربي' : cardKind === 'words' ? 'من مفردات الوحدة' : 'جملة من الكتاب'}</span>
        {!flipped ? <><b lang="es" dir="ltr">{current.es}</b><small>اضغط على البطاقة لإظهار المعنى</small></> : <><b className="flashcard-arabic" lang="ar" dir="rtl">{current.ar}</b>{current.ex && <span className="flashcard-example" lang="es" dir="ltr">{current.ex}</span>}<span className="flashcard-unit-pair" dir="ltr"><small lang="es" dir="ltr">{unit?.es}</small><small lang="ar" dir="rtl">{unit?.ar}</small></span></>}
      </button>
      <div className="flashcard-controls native-flashcard-controls">
        <button className="secondary-button" type="button" onClick={() => step(-1)}><ArrowRight size={18}/> السابقة</button>
        <button className="secondary-button" type="button" onClick={() => speakSpanish(current.es)}><Volume2 size={18}/> اسمع</button>
        <button className="secondary-button" type="button" onClick={() => onSaveWord(current.es)}><Bookmark size={18} fill={savedWords.includes(current.es) ? 'currentColor' : 'none'}/>{savedWords.includes(current.es) ? 'محفوظة' : 'احفظها'}</button>
        <button className="primary-button" type="button" onClick={() => step(1)}>التالية <ArrowLeft size={18}/></button>
      </div>
      <p className="native-flashcard-source">{sourceStageId} · {unit?.ar} · {unit?.es}</p>
    </> : <section className="empty-state flashcard-empty native-flashcard-empty">{!hasNativeCards ? `مافيش بيانات Flashcards أصلية مستخرجة لمرحلة ${stage} لحد دلوقتي. هنفتح البطاقات من بيانات الكتاب الموثقة فقط، من غير ما نبدّلها بأمثلة مؤلفة.` : 'مفيش بطاقات محفوظة في الاختيار ده. غيّر الفلتر أو احفظ بطاقة من الوحدة.'}</section>}
  </div>;
}
function App() {
  const initial = useMemo(readSaved, []);
  const [active, setActive] = useState('home');
  const [lessonOpen, setLessonOpen] = useState(false);
  const [directReader, setDirectReader] = useState(null);
  const [lessonLevel, setLessonLevel] = useState('A1');
  const [lessonId, setLessonId] = useState('A1-0');
  const [a1CourseMode, setA1CourseMode] = useState(false);
  const [a1CourseIndex, setA1CourseIndex] = useState(initial.a1CourseIndex ?? 0);
  const [selectedStage, setSelectedStage] = useState(initial.selectedStage || 'A1.1');
  const [focusLessonId, setFocusLessonId] = useState(null);
  const [displayName, setDisplayName] = useState(initial.displayName || 'متعلم');
  const [xp, setXp] = useState(initial.completedLessons ? (initial.xp ?? 0) : 0);
  const [doneLessons, setDoneLessons] = useState(initial.completedLessons ? (initial.doneLessons ?? 0) : 0);
  const [completedLessons, setCompletedLessons] = useState(initial.completedLessons || []);
  const [savedWords, setSavedWords] = useState(initial.savedWords || []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => { setFocusLessonId(null); }, [selectedStage]);
  useEffect(() => { localStorage.setItem('hola-progress', JSON.stringify({ xp, doneLessons, completedLessons, savedWords, a1CourseIndex, selectedStage, displayName })); }, [xp, doneLessons, completedLessons, savedWords, a1CourseIndex, selectedStage, displayName]);
  function openIslandActivity(pageId, id) { setFocusLessonId(id); setActive(pageId); }
  function openLesson(level = selectedStage.startsWith('A2') ? 'A2' : 'A1', id = currentLessons(selectedStage)[0]?.id || 'A1-0') {
    setA1CourseMode(false); setLessonLevel(level); setLessonId(id);
    const reader = originalReaderForLesson(id);
    if (reader) { setLessonOpen(false); setDirectReader(reader); }
    else setLessonOpen(true);
  }
  function startA1Course(index = courseRanges[selectedStage]?.[0] || 0) {
    const safeIndex = Math.max(0, Math.min(9, index));
    setA1CourseMode(true); setA1CourseIndex(safeIndex); setLessonLevel('A1');
    setLessonId(`A1-${safeIndex}`); setLessonOpen(true);
  }
  function goToA1CourseLesson(index) {
    const safeIndex = Math.max(0, Math.min(9, index));
    setA1CourseIndex(safeIndex); setLessonLevel('A1'); setLessonId(`A1-${safeIndex}`);
  }
  function completeLesson() {
    if (!completedLessons.includes(lessonId)) { setXp(value => value + 15); setCompletedLessons(items => [...items, lessonId]); setDoneLessons(value => value + 1); }
    if (a1CourseMode && a1CourseIndex < 9 && a1CourseIndex < courseRanges[selectedStage][1]) goToA1CourseLesson(a1CourseIndex + 1);
    else { setLessonOpen(false); setA1CourseMode(false); }
  }
  function toggleWord(word) { setSavedWords(items => items.includes(word) ? items.filter(item => item !== word) : [...items, word]); }
  function updateDisplayName(name) { setDisplayName(name.slice(0, 24)); }
  function page() {
    if (active === 'profile') return <ProfilePage selectedStage={selectedStage} onSelectStage={setSelectedStage} displayName={displayName} onChangeName={updateDisplayName} xp={xp} doneLessons={doneLessons}/>;
    if (active === 'path') return <PathPage selectedStage={selectedStage} completedLessons={completedLessons} onOpenLesson={id => openLesson(selectedStage.startsWith('A2') ? 'A2' : 'A1', id)} onOpenActivity={openIslandActivity}/>;
    if (active === 'lessons') return <LessonsPage stage={selectedStage} onSelectStage={setSelectedStage} completedLessons={completedLessons} onOpenLesson={openLesson}/>;
    if (active === 'grammar') return <GrammarPage stage={selectedStage} focusLessonId={focusLessonId}/>;
    if (active === 'listening') return <ListeningPage stage={selectedStage} focusLessonId={focusLessonId}/>;
    if (active === 'speaking') return <SpeakingPage stage={selectedStage} focusLessonId={focusLessonId}/>;
    if (active === 'games') return <GamesPage stage={selectedStage} focusLessonId={focusLessonId} addXp={amount => setXp(value => value + amount)}/>;
    if (active === 'quiz') return <LearningFlow key={`quiz-${selectedStage}-${focusLessonId || 'all'}`} stage={selectedStage} focusLessonId={focusLessonId} onNavigate={setActive} onFinish={amount => setXp(value => value + amount)}/>;
    if (active === 'exam') return <LearningFlow key={`exam-${selectedStage}-${focusLessonId || 'all'}`} stage={selectedStage} focusLessonId={focusLessonId} onNavigate={setActive} exam onFinish={amount => setXp(value => value + amount)}/>;
    if (active === 'flashcards') return <FlashcardsPage key={selectedStage} stage={selectedStage} savedWords={savedWords} onSaveWord={toggleWord}/>;
    if (active === 'words') return <WordsPage stage={selectedStage} savedWords={savedWords} onSaveWord={toggleWord}/>;
    if (active === 'progress') return <ProgressPage xp={xp} doneLessons={doneLessons} savedWords={savedWords} selectedStage={selectedStage}/>;
    return <HomePage onOpenLesson={id => openLesson(selectedStage.startsWith('A2') ? 'A2' : 'A1', id)} onNavigate={setActive} selectedStage={selectedStage} completedLessons={completedLessons}/>;
  }
  const sidebarProps = { active, onNavigate: id => { setActive(id); setMobileMenuOpen(false); }, streak: 0, onProfile: () => { setActive('profile'); setMobileMenuOpen(false); }, displayName, selectedStage };
  return <div className="app-shell">
    <Sidebar {...sidebarProps}/>
    <main className="main-area">
      <Header active={active} selectedStage={selectedStage} displayName={displayName} onProfile={() => setActive('profile')} onSearch={() => setSearchOpen(value => !value)}/>
      {searchOpen && <div className="quick-search"><Search size={18}/><input autoFocus placeholder="دور على محاضرة أو كلمة أو قاعدة…" onKeyDown={event => event.key === 'Escape' && setSearchOpen(false)}/><button onClick={() => setSearchOpen(false)} aria-label="إغلاق البحث"><X size={17}/></button></div>}
      <div className="page-content">{page()}<footer className="app-footer"><span>خطوة بخطوة في الإسباني 💛</span><span>¡Vamos! <span className="footer-star">✳</span></span></footer></div>
    </main>
    {mobileMenuOpen && <div className="mobile-drawer" onClick={() => setMobileMenuOpen(false)}><button className="drawer-close" onClick={() => setMobileMenuOpen(false)} aria-label="إغلاق القائمة"><X/></button><div className="mobile-drawer-panel" onClick={event => event.stopPropagation()}><Sidebar {...sidebarProps}/></div></div>}
    <nav className="mobile-nav" aria-label="التنقل السريع">{mobileNavItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => { setActive(id); setMobileMenuOpen(false); }}><Icon size={20}/><span>{label}</span></button>)}<button className={!mobileNavItems.some(item => item.id === active) ? 'active' : ''} onClick={() => setMobileMenuOpen(true)} aria-expanded={mobileMenuOpen}><MoreHorizontal size={20}/><span>المزيد</span></button></nav>
    {lessonOpen && <LessonModal level={lessonLevel} lessonId={lessonId} savedWords={savedWords} isCompleted={completedLessons.includes(lessonId)} onSaveWord={toggleWord} courseMode={a1CourseMode} courseIndex={a1CourseIndex} onCoursePrevious={() => goToA1CourseLesson(Math.max(courseRanges[selectedStage][0], a1CourseIndex - 1))} onClose={() => { setLessonOpen(false); setA1CourseMode(false); }} onComplete={completeLesson}/>}
    {directReader && <DirectOriginalBookReader reader={directReader} onClose={() => setDirectReader(null)}/>}
  </div>;
}
export default App;
