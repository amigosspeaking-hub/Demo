import React, { useEffect, useMemo, useRef, useState } from 'react';
import { lessonLibrary } from './data/lessons.js';
import { buildListeningItems } from './data/listening.js';
import { grammarGuides } from './data/grammar.js';
import { lessonStories } from './data/stories.js';
import { lessonSentenceBanks } from './data/sentences.js';
import { courseBookMaterials } from './data/courseMaterials.js';
import {
  ArrowLeft, ArrowRight, AudioLines, Award, BookOpen, Bookmark, Check, CheckCircle2, ChevronLeft,
  CircleHelp, Clock3, Gamepad2, GraduationCap, Headphones, House, Lightbulb, Pause,
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
    { id: 'quiz', label: 'اختبار سريع', icon: CircleHelp },
    { id: 'exam', label: 'الامتحانات', icon: Award },
  ] },
  { label: 'مكتبتي', items: [
    { id: 'flashcards', label: 'بطاقات المراجعة', icon: Bookmark },
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

function HomePage({ onOpenLesson, onNavigate, completedLessons, selectedStage }) {
  const courseLessons = currentLessons(selectedStage);
  const completedCount = courseLessons.filter(lesson => completedLessons.includes(lesson.id)).length;
  const courseProgress = Math.round(completedCount / Math.max(1, courseLessons.length) * 100);
  const nextLesson = courseLessons.find(lesson => !completedLessons.includes(lesson.id)) || courseLessons[0];
  const nextPage = courseBookMaterials[nextLesson?.id]?.pages?.[0];
  const allComplete = courseLessons.length > 0 && completedCount === courseLessons.length;

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

function PathPage({ onOpenLesson, onStartA1Course, selectedStage = 'A1.1', completedLessons = [] }) {
  const courseLessons = currentLessons(selectedStage);
  const courseProgress = Math.round(courseLessons.filter(lesson => completedLessons.includes(lesson.id)).length / Math.max(1, courseLessons.length) * 100);
  return <div className="path-page">
    <div className="path-intro">
      <div><span className="eyebrow"><GraduationCap size={15}/> المنهج من A1 لـ C1</span><h2>خريطة طريقك للطلاقة</h2><p>ترتيب المستويات ماشي مع كتب Aula internacional Plus، وبعد B2 نكمّل بكتاب Aula C1.</p></div>
      <div className="path-sticker">🗺️</div>
    </div>
    <div className="path-levels">
      {levels.filter(l => l.id === (selectedStage.startsWith('A2') ? 'A2' : 'A1')).map((l, i) => <section className={`path-level ${l.tone}`} key={l.id}>
        <div className="path-level-head">
          <span className="path-level-number">{i + 1}</span>
          <div><LevelPill level={l.id}/><h3>{l.name}</h3><p>{l.summary}</p></div>
          <span className="path-hours">{l.book}</span>
        </div>
        <div className={`path-topics ${l.id === 'A2' ? 'a2-topics' : ''}`}>
          {l.topics.filter(topic => { const number = Number(String(topic.id || '').split('-')[1]); const [from, to] = courseRanges[selectedStage] || courseRanges['A1.1']; return number >= from && number <= to; }).map((topic, j) => {
            const isStructuredUnit = typeof topic === 'object';
            const topicKey = isStructuredUnit ? topic.es : topic;
            const lessonAvailable = (l.id === 'A1' || l.id === 'A2') && Boolean(lessonLibrary[topic.id]);
            const isLocked = !l.unlocked || !lessonAvailable;
            return <button key={topicKey} onClick={() => lessonAvailable && l.unlocked && onOpenLesson(l.id, topic.id)} disabled={isLocked} className={`${isLocked ? 'topic-locked' : ''} ${isStructuredUnit ? 'book-unit' : ''}`}>
              <span className="topic-check">{completedLessons.includes(topic.id) ? <Check size={14}/> : isLocked ? <LockKeyhole size={13}/> : <Play size={12} fill="currentColor"/>}</span>
              {isStructuredUnit ? <span className="unit-topic"><b lang="es">{topic.es}</b><small>{topic.ar}</small></span> : <span>{topic}</span>}
              {isLocked ? <small className="unit-coming">قريباً</small> : <ChevronLeft size={16}/>}
            </button>;
          })}
        </div>
        {l.id === 'A1' && <div className="selected-course-panel"><div><span className="eyebrow"><BookOpen size={14}/> كورس {selectedStage}</span><b>محاضرات المستوى من هنا</b><small>المحاضرة تفتح داخل الموقع، ومحتوى كل درس منفصل عن باقي الوحدات.</small></div><button className="primary-button" onClick={() => onStartA1Course(courseRanges[selectedStage]?.[0] || 0)}><Play size={14} fill="currentColor"/> ابدأ محاضرات {selectedStage}</button></div>}
        {l.id === 'A2' && <div className="a2-course-plan">
          <div className="a2-course-heading"><div><span className="a2-plan-label"><BookOpen size={14}/> محاضرات {selectedStage}</span><b>محتوى مستقل لكل محاضرة</b></div><span className="a2-plan-icon">🗓️</span></div>
          <div className="a2-stage-list">{a2Stages.filter(stage => stage.id === selectedStage).map(stage => <article className="a2-stage" key={stage.id}>
            <div className="a2-stage-top"><LevelPill level={stage.id}/><span>{stage.meetings}</span><b>{stage.units}</b></div><p>{stage.focus}</p><div className="a2-grammar"><BookOpen size={13}/><span><b>جرامر:</b> {stage.grammar}</span></div><small className="a2-checkpoint"><CheckCircle2 size={13}/>{stage.check}</small>
          </article>)}</div>
        </div>}
        <div className="path-level-foot"><div className="progress-track"><i style={{width:`${courseProgress}%`}}/></div><small>{courseProgress ? `${courseProgress}% مكتمل في ${selectedStage}` : `ابدأ أول درس في ${selectedStage}`}</small></div>
      </section>)}
    </div>
    <div className="curriculum-note"><Lightbulb size={18}/><span><b>طريقة الوحدة:</b> نلاحظ اللغة في سياق، نتمرّن على الجرامر والمفردات، وبعدين نستخدم اللي اتعلمناه في مهمة تواصلية، مع استماع ونطق وثقافة. المحتوى والأنشطة بالمصري وبصياغة أصلية.</span></div>
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
function originalReaderForLesson(id) {
  const match = /^(A1|A2)-(\d+)$/.exec(id || '');
  if (!match) return null;
  const [, level, rawIndex] = match;
  const index = Number(rawIndex);
  const course = level === 'A2' ? (index >= 1 && index <= 4 ? 'A2.1' : index >= 5 && index <= 8 ? 'A2.2' : index >= 9 && index <= 10 ? 'A2.3' : null)
    : index <= 3 ? 'A1.1' : index <= 6 ? 'A1.2' : index <= 9 ? 'A1.3' : null;
  const firstPage = courseBookMaterials[id]?.pages?.[0]?.page;
  if (!course || !firstPage) return null;
  return { course, page: firstPage, src: `/materials/readers/${course}/index.html#p${firstPage}` };
}

function OriginalBookReader({ reader, onReturn }) {
  return <section className="book-reader-panel" aria-label={`قارئ الكتاب ${reader.course}`}>
    <div className="book-reader-toolbar"><div><span className="book-reader-kicker"><BookOpen size={14}/> صفحات الكتاب والتدريبات</span><b>{reader.course} · افتح فهرس الوحدة من داخل القارئ</b></div><button type="button" onClick={onReturn}>ارجع لخطوات المحاضرة <ArrowRight size={15}/></button></div>
    <iframe title={`قارئ الكتاب التفاعلي ${reader.course}`} src={reader.src} loading="eager" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin" allow="autoplay" />
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
  function next() { if (quiz) { if (answer === 0) onComplete(); return; } setStep(step + 1); setAnswer(null); }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className={`lesson-modal ${readerOpen ? 'lesson-modal-reader' : ''}`} role="dialog" aria-modal="true" aria-labelledby={readerOpen ? 'book-reader-title' : 'lesson-title'}>
    <div className="modal-top"><span id={readerOpen ? 'book-reader-title' : undefined}>{readerOpen ? <><BookOpen size={16}/> قارئ الكتاب · {reader?.course}</> : courseMode ? <><BookOpen size={16}/> {courseStage.id} · كورس A1 · الوحدة {courseIndex}</> : <><BookOpen size={16}/> نموذج درس · {config.heading}</>}</span><button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={19}/></button></div>
    <div className="lesson-progress"><i style={{width:`${quiz?100:(step+1)/(words.length+1)*100}%`}}/></div>
    <div className="modal-content">{readerOpen && reader ? <OriginalBookReader reader={reader} onReturn={() => setReaderOpen(false)}/> : !quiz ? <>
      <div className="lesson-step-label">{config.objective}</div>
      <div className="lesson-word-visual"><span>{config.emoji}</span><div className="word-orbit orbit-one"/><div className="word-orbit orbit-two"/></div>
      <h2 id="lesson-title" className="big-spanish" lang="es">{current.es}</h2><p className="big-arabic">{current.ar}</p>
      <div className="pronunciation-line"><span>النطق التقريبي: <b>{current.say}</b></span><button className="listen-button" onClick={()=>speakSpanish(current.es)} title="صوت إسباني مولّد آليًا، مش تسجيل الكتاب"><Volume2 size={17}/> اسمع النطق</button></div>
      <small className="speech-source-note">صوت إسباني مولّد من جهازك، مش تسجيل الكتاب</small>
      {grammarGuide && <div className="lesson-grammar-detail"><span><BookOpen size={14}/> {grammarGuide.title}</span><p>{grammarGuide.explanation}</p>{grammarGuide.examples.slice(0, 1).map(([es, ar]) => <div key={es}><b lang="es" dir="ltr">{es}</b><small>{ar}</small></div>)}</div>}
      <div className="lesson-example"><span>💬 مثال الدرس</span><b lang="es">{config.example}</b><small>{config.translation}</small></div>
      <BookLessonMaterials lessonId={lessonId}/>
      {reader && <button className="book-reader-launch" type="button" onClick={() => setReaderOpen(true)}><span className="book-reader-launch-icon"><BookOpen size={19}/></span><span><b>افتح صفحات الكتاب في القارئ</b><small>{reader.course} · الفهرس، صفحات الوحدة، الإجابات والصوتيات</small></span><ArrowLeft size={17}/></button>}
      <button className="save-in-lesson" onClick={() => onSaveWord(current.es)}><Bookmark size={16} fill={savedWords.includes(current.es) ? 'currentColor' : 'none'}/>{savedWords.includes(current.es) ? 'اتحفظت في قاموسك' : 'احفظ الكلمة'}</button>
    </> : <>
      <div className="lesson-step-label">اختبار سريع · آخر خطوة</div><div className="quiz-finish-icon">🎯</div><h2 id="lesson-title">تمام! نراجع اللي اتعلمناه</h2>
      <p className="quiz-finish-question">{config.question}</p>
      <div className="modal-quiz-answers">{config.answers.map((a,i)=><button key={a} dir={/[A-Za-zÀ-ÿ]/.test(a) ? 'ltr' : 'rtl'} className={answer===i?(i===0?'correct':'wrong'):answer!==null&&i===0?'correct':''} onClick={()=>setAnswer(i)}>{a}{answer===i&&i===0&&<Check size={16}/>}</button>)}</div>
      {answer!==null&&<div className={`quiz-feedback ${answer===0?'good':'try-again'}`}>{answer===0?'صح عليك! ¡Excelente! 🎉':`الإجابة الصح: ${config.answers[0]}`}</div>}
    </>}</div>
    <div className={`modal-footer ${courseMode ? 'course-modal-footer' : ''}`}>
      {readerOpen ? <><span>صفحات الكتاب والتدريبات داخل الموقع</span><button className="primary-button" onClick={() => setReaderOpen(false)}>العودة للمحاضرة <ArrowRight size={15}/></button></> : <>
        {courseMode && <button className="course-prev-button" onClick={onCoursePrevious} disabled={courseIndex<=courseStage.startIndex}><ArrowLeft size={14}/> الدرس السابق</button>}
        <span>{isCompleted ? 'المحاضرة دي مكتملة قبل كده' : <><span className="modal-xp">⚡</span> +١٥ نقطة خبرة</>}</span>
        <button className="primary-button" onClick={next}>{quiz ? answer===0 ? courseMode ? courseIndex===courseStage.endIndex?`إنهاء ${courseStage.id}`:'الدرس التالي' : 'خلصت الدرس' : 'اختار إجابة' : step===words.length-1?'اختبري نفسك':'الكلمة اللي بعدها'} <ArrowLeft size={16}/></button>
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
  { id: 'match', title: 'تطابق الكلمات', description: 'وصّل كل تعبير إسباني بمعناه.', icon: '🧩', mode: 'matching' },
  { id: 'quiz', title: 'تحدي الاختيار', description: 'جاوب بنك أسئلة متغير من محاضرتك.', icon: '🎯', mode: 'choice' },
  { id: 'listen', title: 'اسمع واختار', description: 'اسمع الجملة الإسبانية وحدد معناها.', icon: '🎧', mode: 'listening' },
  { id: 'order', title: 'رتّب الجملة', description: 'كوّن الجملة الإسبانية من الكلمات.', icon: '🔤', mode: 'order' },
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
  const lessons = onlyLessonId ? currentLessons(stage).filter(item => item.id === onlyLessonId) : currentLessons(stage);
  const allWords = currentLessons(stage).flatMap(item => item.words.map(word => word.ar));
  return lessons.flatMap(lesson => [
    ...lesson.words.map(word => ({ prompt: `يعني إيه «${word.es}»؟`, correct: word.ar, spanish: word.es, source: lesson.heading })),
    { prompt: lesson.question, correct: lesson.answers[0], spanish: lesson.example, source: lesson.heading },
  ]).map(item => ({ ...item, options: [...new Set([item.correct, ...allWords.filter(word => word !== item.correct)])].slice(0, 4) }));
}
function shuffled(items) { return [...items].sort(() => Math.random() - 0.5); }
function drawQuestions(pool, amount) { if (!pool.length) return []; const shuffledPool = shuffled(pool); return Array.from({ length: amount }, (_, index) => shuffledPool[index % shuffledPool.length]); }
function CourseSelect({ value, onChange, label = 'المستوى' }) {
  return <label className="course-select"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)}>{courseOptions.map(stage => <option key={stage} value={stage}>{stage}</option>)}</select></label>;
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

function BookAudioPlayer({ track }) {
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
  function stop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause(); audio.currentTime = 0; setCurrentTime(0);
  }
  function changeRate(value) {
    setRate(value);
    if (audioRef.current) audioRef.current.playbackRate = value;
  }
  const timeLabel = value => `${Math.floor((value || 0) / 60)}:${String(Math.floor((value || 0) % 60)).padStart(2, '0')}`;
  if (!track) return null;
  return <div className="book-audio-player" lang="es" dir="ltr" aria-label="Reproductor de audio en español">
    <audio ref={audioRef} src={track.src} preload="metadata" onPlay={() => { setPlaying(true); setError(''); }} onPause={() => setPlaying(false)} onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onDurationChange={event => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime || 0)} onEnded={event => { setPlaying(false); setCurrentTime(event.currentTarget.currentTime || duration); }} onError={() => setError('No se pudo cargar el audio.')} />
    <div className="book-audio-top"><b>{track.title}</b><span>{track.variant === 'alternativa' ? 'Versión alternativa' : `Pista ${track.id}`}</span></div>
    <div className="book-audio-controls"><button className="book-audio-main" onClick={toggle} aria-label={playing ? 'Pausar audio' : 'Reproducir audio'}>{playing ? <Pause size={16}/> : <Play size={16}/>}<span>{playing ? 'Pausar' : 'Reproducir'}</span></button><button onClick={stop} aria-label="Detener audio" disabled={!playing && currentTime === 0}><X size={15}/><span>Detener</span></button><div className="book-audio-rates" aria-label="Velocidad de reproducción">{[0.5, 0.75, 1, 1.25].map(value => <button key={value} className={rate === value ? 'selected' : ''} onClick={() => changeRate(value)} aria-pressed={rate === value}>{value}×</button>)}</div></div>
    <div className="book-audio-seek"><span>{timeLabel(currentTime)}</span><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={event => { if (audioRef.current) { audioRef.current.currentTime = Number(event.target.value); setCurrentTime(Number(event.target.value)); } }} aria-label="Buscar en el audio" disabled={!duration}/><span>{timeLabel(duration)}</span></div>
    {error && <small className="book-audio-error" role="status">{error}</small>}
  </div>;
}
function BookLessonMaterials({ lessonId, mode = 'lesson' }) {
  const material = courseBookMaterials[lessonId];
  const [pageIndex, setPageIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  useEffect(() => { setPageIndex(0); setTrackIndex(0); }, [lessonId]);
  if (!material) return null;
  const page = material.pages[pageIndex] || material.pages[0];
  const track = material.tracks[trackIndex] || material.tracks[0];
  function selectTrack(event) {
    const index = Number(event.target.value);
    setTrackIndex(index);
    const targetPage = material.tracks[index]?.page;
    const match = material.pages.findIndex(item => item.page === targetPage);
    if (match >= 0) setPageIndex(match);
  }
  return <section className={`book-material-card ${mode === 'listening' ? 'book-listening-card' : ''}`} aria-label="مواد الدرس من الكتاب">
    <div className="book-material-heading"><span className="book-material-icon"><BookOpen size={17}/></span><div><span className="book-material-kicker">{mode === 'listening' ? 'استماع من الكتاب' : 'مادة المحاضرة'}</span><h3 lang="es" dir="ltr">{material.title}</h3><small>{material.book} · {material.unit}</small></div></div>
    <div className="book-material-selectors"><label><span>المقطع الصوتي</span><select value={trackIndex} onChange={selectTrack}>{material.tracks.map((item, index) => <option key={`${item.id}-${item.variant}`} value={index} dir="auto">{item.title} · {item.id}{item.variant === 'alternativa' ? ' (alternativa)' : ''}</option>)}</select></label><label><span>صفحة الكتاب</span><select value={pageIndex} onChange={event => setPageIndex(Number(event.target.value))}>{material.pages.map((item, index) => <option key={item.page} value={index}>صفحة {item.page}</option>)}</select></label></div>
    {page && <figure className="book-page-preview"><img src={page.src} alt={`صفحة ${page.page} من كتاب ${material.book}`} loading="lazy"/><figcaption>صفحة {page.page} · {material.book}</figcaption></figure>}
    {track && <BookAudioPlayer key={track.src} track={track}/>}
  </section>;
}
function BookListeningLibrary({ stage }) {
  const lessons = currentLessons(stage).filter(lesson => courseBookMaterials[lesson.id]);
  const [lessonId, setLessonId] = useState(lessons[0]?.id || '');
  useEffect(() => { setLessonId(lessons[0]?.id || ''); }, [stage]);
  if (!lessons.length) return null;
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  return <section className="book-listening-library"><div className="book-listening-library-head"><div><span className="eyebrow"><Headphones size={15}/> تسجيلات الكتاب</span><h2>استمع للمادة المرتبطة بمحاضرتك</h2><p>اختر محاضرة من {stage}؛ التسجيل والصفحات يتغيران معها.</p></div><label className="course-select"><span>المحاضرة</span><select value={lesson.id} onChange={event => setLessonId(event.target.value)}>{lessons.map(item => <option key={item.id} value={item.id}>{item.heading.replace(/^A[12](?:\.\d)? · /, '')}</option>)}</select></label></div><BookLessonMaterials key={lesson.id} lessonId={lesson.id} mode="listening"/></section>;
}
function GrammarPage({ stage }) {
  const lessons = currentLessons(stage);
  return <div className="grammar-page"><section className="course-page-intro grammar-intro"><span className="eyebrow"><BookOpen size={15}/> شرح مدرس بالمصري</span><h2>جرامر {stage}</h2><p>شرح القاعدة الموجودة في كل محاضرة مع أمثلة وتدريب سريع.</p><span className="active-course-label">المستوى النشط: {stage}</span></section>
    <div className="grammar-guide-list">{lessons.map((lesson, index) => { const guide = grammarGuides[lesson.id] || { title: lesson.grammar || 'قاعدة الدرس', explanation: lesson.grammar || '', examples: [[lesson.example, lesson.translation]], practice: lesson.question }; return <article className="grammar-guide" key={lesson.id}><div className="grammar-guide-head"><span className="course-lesson-number">{index + 1}</span><div><span className="level-pill">{stage}</span><h3>{guide.title}</h3><small lang="es" dir="ltr">{lesson.heading.replace(/^A[12](?:\.\d)? · /, '')}</small></div></div><p className="grammar-explanation">{guide.explanation}</p><div className="grammar-example-list">{guide.examples.map(([es, ar]) => <div className="grammar-example-row" key={es}><b lang="es" dir="ltr">{es}</b><span dir="rtl" lang="ar">{ar}</span><button onClick={() => speakSpanish(es)} aria-label={`اسمع ${es}`}><Volume2 size={16}/></button></div>)}</div><div className="grammar-practice"><Lightbulb size={16}/><span><b>جرّب بنفسك:</b> {guide.practice}</span></div></article>; })}</div>
  </div>;
}
function ListeningPage({ stage }) {
  const lessons = currentLessons(stage);
  const lessonIds = new Set(lessons.map(lesson => lesson.id));
  const items = buildListeningItems(lessonLibrary).filter(item => lessonIds.has(item.id));
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const [query, setQuery] = useState('');
  const [showArabic, setShowArabic] = useState(true);
  const [rate, setRate] = useState(1);
  const [playerState, setPlayerState] = useState('idle');
  const [playerProgress, setPlayerProgress] = useState(0);
  const [playerError, setPlayerError] = useState('');
  const utteranceRef = useRef(null);
  const selected = items.find(item => item.id === selectedId) || items[0];
  const visible = items.filter(item => `${item.title} ${item.spanish} ${item.arabic}`.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => { if (!items.some(item => item.id === selectedId)) setSelectedId(items[0]?.id || ''); }, [stage]);
  useEffect(() => { setPlayerState('idle'); setPlayerProgress(0); setPlayerError(''); window.speechSynthesis?.cancel(); }, [selectedId]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  function speak() {
    if (!selected?.spanish) return;
    if (!('speechSynthesis' in window)) { setPlayerState('error'); setPlayerError('La síntesis de voz no está disponible en este navegador.'); return; }
    const speech = window.speechSynthesis;
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(selected.spanish);
    utterance.lang = 'es-ES'; utterance.rate = rate; utteranceRef.current = utterance;
    const voices = speech.getVoices();
    utterance.voice = voices.find(voice => voice.lang?.toLowerCase() === 'es-es') || voices.find(voice => voice.lang?.toLowerCase().startsWith('es')) || null;
    utterance.onstart = () => { setPlayerState('playing'); setPlayerProgress(0); setPlayerError(''); };
    utterance.onboundary = event => { if (selected.spanish.length) setPlayerProgress(Math.min(99, Math.round(event.charIndex / selected.spanish.length * 100))); };
    utterance.onend = () => { setPlayerState('idle'); setPlayerProgress(100); utteranceRef.current = null; };
    utterance.onerror = event => { if (event.error !== 'canceled' && event.error !== 'interrupted') { setPlayerError('No se pudo reproducir la voz. Inténtalo otra vez.'); setPlayerState('error'); } else setPlayerState('idle'); utteranceRef.current = null; };
    speech.speak(utterance);
  }
  function togglePlayback() {
    if (!('speechSynthesis' in window)) return;
    if (playerState === 'playing') { window.speechSynthesis.pause(); setPlayerState('paused'); }
    else if (playerState === 'paused') { window.speechSynthesis.resume(); setPlayerState('playing'); }
  }
  function stopPlayback() {
    window.speechSynthesis?.cancel(); utteranceRef.current = null; setPlayerState('idle'); setPlayerProgress(0); setPlayerError('');
  }
  return <div className="listening-page"><section className="listening-intro"><div><span className="eyebrow"><Headphones size={15}/> استماع {stage}</span><h2>اسمع الجملة، والترجمة جنبها</h2><p>اختر محاضرة من مستواك. كل سطر إسباني من الشمال لليمين ومعناه العربي مقابله.</p></div><div className="listening-summary"><b>{items.length}</b><span>عبارة تدريب</span></div></section>
    <div className="listening-layout"><aside className="listening-library"><div className="listening-library-head"><div><h3>عبارات المحاضرات</h3><span>{visible.length} عبارة</span></div><AudioLines size={19}/></div><label className="listening-search"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث في العبارات" aria-label="بحث في العبارات"/></label><div className="listening-items">{visible.map(item => <button key={item.id} className={`listening-item ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)} aria-pressed={selected?.id === item.id}><span className="listening-item-icon"><Headphones size={15}/></span><span className="listening-item-copy"><b>{item.title}</b><small lang="es" dir="ltr">{item.spanish}</small></span><span className="listening-item-level">{stage}</span></button>)}{!visible.length && <p className="listening-empty">مفيش عبارة مطابقة.</p>}</div></aside>
      <section className="listening-player"><div className="listening-player-head"><div><span className="listening-kicker">جملة من {stage}</span><h3>{selected?.title || 'اختار محاضرة'}</h3></div></div>
        <div className={`listening-transcript bilingual-transcript ${showArabic ? '' : 'arabic-hidden'}`} data-testid="bilingual-transcript"><div className="transcript-spanish" lang="es" dir="ltr">{selected?.spanish}</div>{showArabic && <div className="transcript-arabic" lang="ar" dir="rtl">{selected?.arabic}</div>}</div>
        <div className="listening-controls"><button className="translation-toggle" onClick={() => setShowArabic(value => !value)}>{showArabic ? 'إخفاء الترجمة العربية' : 'إظهار الترجمة العربية'}</button><div className="speech-rates" aria-label="Velocidad de reproducción">{[0.5, 0.75, 1, 1.25].map(value => <button key={value} className={rate === value ? 'selected' : ''} onClick={() => { setRate(value); if (playerState === 'playing' || playerState === 'paused') { stopPlayback(); } }} aria-pressed={rate === value}>{value.toFixed(value === 1 ? 1 : 2).replace(/0$/, '')}×</button>)}</div></div><div className="generated-audio-player" lang="es" dir="ltr" aria-label="Reproductor de audio en español"><div className="generated-player-buttons"><button onClick={speak} disabled={!selected?.spanish}><Play size={16}/>{playerState === 'playing' || playerState === 'paused' ? 'Reiniciar' : 'Reproducir'}</button><button onClick={togglePlayback} disabled={playerState !== 'playing' && playerState !== 'paused'}><span>{playerState === 'paused' ? '▶' : 'Ⅱ'}</span>{playerState === 'paused' ? 'Continuar' : 'Pausar'}</button><button onClick={stopPlayback} disabled={playerState === 'idle' && playerProgress !== 100}><X size={15}/>Detener</button></div><div className="generated-player-track" role="progressbar" aria-label="Progreso del audio" aria-valuemin="0" aria-valuemax="100" aria-valuenow={playerProgress}><i style={{ width: `${playerProgress}%` }}/></div><span className="generated-player-state">{playerError || (playerState === 'playing' ? 'Reproduciendo' : playerState === 'paused' ? 'En pausa' : playerProgress === 100 ? 'Reproducción finalizada' : 'Listo')}</span></div>
        <p className="listening-source-note"><Volume2 size={14}/> النطق الإسباني مُولّد من الجهاز. شغّل الصوت واختار السرعة المناسبة.</p></section></div><BookListeningLibrary stage={stage}/></div>;
}
function SpeakingPage({ stage }) {
  const lessons = currentLessons(stage);
  const [lessonId, setLessonId] = useState(lessons[0]?.id || '');
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('اضغط زر الميكروفون وانطق الجملة الإسبانية.');
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  const story = lessonStories[lessonId] || { es: lesson?.example || '', ar: lesson?.translation || '' };
  const cleanSpeech = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f¿?¡!.,;:]/g, '').replace(/\s+/g, ' ').trim();
  const heardWords = cleanSpeech(transcript).split(' ').filter(Boolean);
  const expectedWords = cleanSpeech(lesson?.example || '').split(' ').filter(Boolean);
  useEffect(() => { if (!lessons.some(item => item.id === lessonId)) setLessonId(lessons[0]?.id || ''); }, [stage]);
  function startRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); setStatus('المتصفح الحالي لا يدعم التعرّف الصوتي. جرّب Chrome أو Edge.'); return; }
    const recognition = new SpeechRecognition(); recognition.lang = 'es-ES'; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onstart = () => { setIsListening(true); setTranscript(''); setStatus('بسمعك دلوقتي… انطق الجملة بالإسباني.'); };
    recognition.onerror = event => { setIsListening(false); setStatus(event.error === 'not-allowed' ? 'اسمح للمتصفح باستخدام الميكروفون وجرّب تاني.' : 'ما التقطتش الصوت بوضوح؛ قرّب من الميكروفون وجرّب تاني.'); };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = event => { const spoken = event.results[0][0].transcript; setTranscript(spoken); setStatus(cleanSpeech(spoken) === cleanSpeech(lesson.example) ? 'الجملة كلها مطابقة — ممتاز!' : 'الكلمات الخضرا مطابقة؛ راجع الحمراء وحاول تاني.'); };
    recognition.start();
  }
  return <div className="speaking-page"><section className="course-page-intro speaking-intro"><span className="eyebrow"><Mic size={15}/> تحدث من الميكروفون</span><h2>اسمع، انطق، وراجع كلامك</h2><p>اختار محاضرة وانطق الجملة بالإسباني باستخدام المايك.</p><label className="course-select"><span>المحاضرة</span><select value={lessonId} onChange={event => { setLessonId(event.target.value); setTranscript(''); }}>{lessons.map(item => <option key={item.id} value={item.id}>{item.heading}</option>)}</select></label></section>
    {lesson && <section className="speaking-card"><div className="speaking-lesson-label">تحدّث من {lesson.heading}</div><div className="speaking-prompt" lang="es" dir="ltr">{lesson.example}</div><p className="speaking-translation" dir="rtl">{lesson.translation}</p><button className={`mic-start ${isListening ? 'recording' : ''}`} onClick={startRecognition} disabled={isListening || !supported}><Mic size={21}/>{isListening ? 'بيسجّل…' : 'ابدأ التحدث'}</button><div className="speech-feedback" role="status"><span className={transcript ? 'feedback-ready' : ''}>{status}</span>{transcript && <div className="speech-recognized"><small>مقارنة كلمة بكلمة:</small><div className="speech-word-check" lang="es" dir="ltr">{expectedWords.map((word, index) => <span key={`${word}-${index}`} className={heardWords[index] === word ? 'word-right' : 'word-wrong'}>{heardWords[index] || '—'}</span>)}{heardWords.slice(expectedWords.length).map((word, index) => <span key={`extra-${word}-${index}`} className="word-wrong">{word}</span>)}</div><b lang="es" dir="ltr">اللي اتقال: {transcript}</b></div>}</div><button className="speech-repeat" onClick={() => speakSpanish(lesson.example)}><Volume2 size={16}/> اسمع النموذج الإسباني</button></section>}
    <section className="speaking-story"><span className="eyebrow"><BookOpen size={14}/> حكاية قصيرة · {stage}</span><h3>{lesson?.heading.replace(/^A[12](?:\.\d)? · /, '')}</h3><div className="story-bilingual"><p lang="es" dir="ltr">{story.es}</p><p dir="rtl">{story.ar}</p></div><button className="speech-repeat" onClick={() => speakSpanish(story.es)}><Volume2 size={16}/> اسمع الحكاية</button></section></div>;
}
function LearningFlow({ stage, exam = false, onFinish }) {
  const lessons = currentLessons(stage);
  const [lessonId, setLessonId] = useState('all');
  const pool = useMemo(() => questionPool(stage, lessonId === 'all' ? null : lessonId), [stage, lessonId]);
  const amount = exam ? 10 : Math.min(8, Math.max(5, pool.length));
  const [questions, setQuestions] = useState(() => drawQuestions(pool, amount));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(exam ? 15 * 60 : 0);
  const item = questions[index];
  const choices = useMemo(() => shuffled(item?.options || []), [item]);
  useEffect(() => { if (!exam || finished) return undefined; const timer = setInterval(() => setSeconds(value => { if (value <= 1) { clearInterval(timer); setFinished(true); return 0; } return value - 1; }), 1000); return () => clearInterval(timer); }, [exam, finished]);
  function restart(nextLessonId = lessonId) { const nextPool = questionPool(stage, nextLessonId === 'all' ? null : nextLessonId); const nextAmount = exam ? 10 : Math.min(8, Math.max(5, nextPool.length)); setQuestions(drawQuestions(nextPool, nextAmount)); setIndex(0); setAnswer(null); setScore(0); setFinished(false); setSeconds(exam ? 900 : 0); }
  function next() { const total = score + (answer === item?.correct ? 1 : 0); setScore(total); if (index + 1 === questions.length) { onFinish(Math.round(total / questions.length * (exam ? 40 : 15))); setFinished(true); } else { setIndex(value => value + 1); setAnswer(null); } }
  const percentage = questions.length ? Math.round(score / questions.length * 100) : 0;
  return <div className="learning-flow"><section className="course-page-intro"><span className="eyebrow">{exam ? <Award size={15}/> : <CircleHelp size={15}/>} {exam ? 'امتحان مستقل' : 'تدريب قصير'}</span><h2>{exam ? `امتحان ${stage}` : `Quiz · ${stage}`}</h2><p>{exam ? 'اختبار مرحلي مستقل من بنك الأسئلة؛ الوقت والنتيجة يظهران هنا.' : 'اختار المحاضرة أو اختبر نفسك في كل محتوى المستوى الحالي.'}</p>{!finished && <label className="course-select"><span>نطاق الأسئلة</span><select value={lessonId} onChange={event => { const nextId = event.target.value; setLessonId(nextId); restart(nextId); }}><option value="all">كل محاضرات {stage}</option>{lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.heading}</option>)}</select></label>}</section>
    {finished ? <section className="flow-result"><div className="result-medal">{percentage >= 70 ? '🏆' : '📘'}</div><span className="eyebrow">{exam ? 'نتيجة الامتحان' : 'نتيجة التدريب'}</span><h3>{score} / {questions.length} إجابات صحيحة</h3><p>{percentage >= 70 ? 'ممتاز! راجع الأخطاء وكمل للمحاضرة التالية.' : 'راجع المحاضرة، وبعدها جرّب مرة تانية.'}</p><div className="result-progress"><i style={{ width: `${percentage}%` }} /></div><button className="primary-button" onClick={() => restart()}><RotateCcw size={16}/> ابدأ محاولة جديدة</button></section> : item && <section className="flow-question-card"><div className="flow-stats"><span>{exam ? <><Timer size={15}/> {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</> : <><Target size={15}/> سؤال {index + 1} من {questions.length}</>}</span><span><CheckCircle2 size={15}/> النتيجة {score}</span></div><div className="flow-progress"><i style={{ width: `${(index + 1) / questions.length * 100}%` }}/></div><small className="flow-source">{item.source}</small><h3>{item.prompt}</h3>{item.spanish && <p lang="es" dir="ltr" className="flow-spanish">{item.spanish}</p>}<div className="flow-options">{choices.map((option, i) => <button key={`${item.prompt}-${option}`} dir={/[A-Za-zÀ-ÿ]/.test(option) ? 'ltr' : 'rtl'} onClick={() => answer === null && setAnswer(option)} className={`${answer === option ? (option === item.correct ? 'is-correct' : 'is-wrong') : ''} ${answer !== null && option === item.correct ? 'is-correct' : ''}`}><span>{['A','B','C','D'][i]}</span>{option}{answer === option && (option === item.correct ? <Check size={17}/> : <X size={17}/>)}</button>)}</div>{answer !== null && <div className={`flow-feedback ${answer === item.correct ? 'good' : 'bad'}`}>{answer === item.correct ? 'إجابة صحيحة — عاش!' : `الإجابة الصحيحة: ${item.correct}`}</div>}<button className="primary-button flow-next" disabled={answer === null} onClick={next}>{index + 1 === questions.length ? 'اعرض النتيجة' : 'السؤال التالي'} <ArrowLeft size={16}/></button></section>}
  </div>;
}
function GameRun({ game, lesson, stage, onBack, onAward }) {
  const words = lesson.words;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answerChoice, setAnswerChoice] = useState(null);
  const [matched, setMatched] = useState([]);
  const [usedTiles, setUsedTiles] = useState([]);
  const [order, setOrder] = useState([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(90);
  const [feedback, setFeedback] = useState('');
  const [finished, setFinished] = useState(false);
  const questions = useMemo(() => questionPool(stage, lesson.id), [stage, lesson.id]);
  const current = words[index % words.length];
  const question = questions[index % questions.length];
  const sentenceBank = [lesson.example, ...(lessonSentenceBanks[lesson.id] || [])];
  const roundSentence = sentenceBank[index % sentenceBank.length];
  const sentenceTokens = useMemo(() => shuffled(roundSentence.split(/\s+/)), [roundSentence]);
  const matchWords = useMemo(() => shuffled(words), [lesson.id, game.id]);
  const roundCount = game.id === 'match' ? words.length : game.id === 'order' ? sentenceBank.length : questions.length;
  useEffect(() => { if (finished) return undefined; const timer = setInterval(() => setSeconds(value => { if (value <= 1) { clearInterval(timer); setFinished(true); return 0; } return value - 1; }), 1000); return () => clearInterval(timer); }, [finished]);
  function mark(option) { const correct = option === question.correct; setAnswerChoice(option); if (correct) { setScore(value => value + 10); setFeedback('صح! +١٠ نقاط'); } else { setLives(value => Math.max(0, value - 1)); setFeedback('مش دي — الإجابة الخضرا موضحة قدامك.'); } setSelected(correct ? 'correct' : 'wrong'); }
  function next() { if (lives <= 0) { setFinished(true); return; } if (game.id === 'match' && matched.length < words.length - 1) { setFeedback('كمّل توصيل باقي الكلمات.'); return; } if (index + 1 >= roundCount) { setFinished(true); return; } setIndex(value => value + 1); setSelected(null); setAnswerChoice(null); setUsedTiles([]); setOrder([]); setFeedback(''); }
  useEffect(() => { if (game.id === 'match' && matched.length === words.length) setFinished(true); }, [matched, game.id, words.length]);
  useEffect(() => { if (finished) onAward(score); }, [finished]);
  const choices = useMemo(() => shuffled([...new Set([question.correct, ...question.options.filter(option => option !== question.correct)])]).slice(0, 4), [question]);
  function selectMatchArabic(ar) { if (!selected || selected === 'correct') return; const isCorrect = words.find(word => word.es === selected)?.ar === ar; if (isCorrect) { setMatched(value => [...value, selected]); setFeedback('تطابق صحيح — عاش!'); setScore(value => value + 10); } else { setLives(value => Math.max(0, value - 1)); setFeedback('مش المطابقة دي؛ الصح باين بالأخضر.'); } }
  function checkOrder() { const proposed = order.map(i => sentenceTokens[i]).join(' '); const norm = value => value.toLowerCase().replace(/[.,!?¿¡]/g, '').replace(/\s+/g, ' ').trim(); const isCorrect = norm(proposed) === norm(roundSentence); setSelected(isCorrect ? 'correct' : 'wrong'); setFeedback(isCorrect ? 'الجملة مظبوطة! +١٠ نقاط' : `الجملة الصحيحة: ${roundSentence}`); if (isCorrect) setScore(value => value + 10); else setLives(value => Math.max(0, value - 1)); }
  return <div className="game-run-page"><header className="game-run-top"><button className="icon-button" onClick={onBack} aria-label="العودة لصالة الألعاب"><ArrowRight size={18}/></button><div><span className="level-pill">{lesson.heading.split(' · ')[0]}</span><b>{game.title}</b></div><div className="run-stats"><span><Heart size={16} fill="currentColor"/> {lives}</span><span><Timer size={16}/> {seconds}s</span><span>⚡ {score}</span></div></header>
    {finished ? <section className="game-result"><div className="result-medal">{lives > 0 ? '🏆' : '💪'}</div><span className="eyebrow">انتهت الجولة</span><h2>{lives > 0 ? 'عاش! جولة ممتازة' : 'خلصت القلوب — جرب تاني'}</h2><p>جمعت {score} نقطة في {game.title} · {lesson.heading}</p><div className="game-result-actions"><button className="primary-button" onClick={onBack}>ارجع لصالة الألعاب</button></div></section> : <section className="game-board"><div className="game-board-heading"><span>{game.icon} {lesson.heading}</span><div className="game-run-progress"><i style={{width:`${Math.min(100, (game.id === 'match' ? matched.length : index + 1) / roundCount * 100)}%`}}/></div></div>
      {game.id === 'match' ? <><h2>وصّل الإسباني بمعناه</h2><div className="live-match-grid"><div>{words.map(word => <div key={word.es} className={`live-match-choice ${selected === word.es ? 'selected' : ''} ${matched.includes(word.es) ? 'matched' : ''}`}><button className="live-match-text" onClick={() => { if (!matched.includes(word.es)) { setSelected(word.es); setFeedback('اختار المعنى المقابل.'); } }} disabled={matched.includes(word.es)} lang="es" dir="ltr">{word.es}</button><button className="match-sound" onClick={() => speakSpanish(word.es)} aria-label={`اسمع ${word.es}`}><Volume2 size={15}/></button></div>)}</div><div>{matchWords.map(word => <button key={word.ar} className={`live-match-choice arabic ${matched.some(es => words.find(item => item.es === es)?.ar === word.ar) ? 'matched' : ''}`} onClick={() => selectMatchArabic(word.ar)} disabled={matched.some(es => words.find(item => item.es === es)?.ar === word.ar)}>{word.ar}</button>)}</div></div></> : game.id === 'order' ? <><h2>رتّب كلمات الجملة</h2><p className="order-built" lang="es" dir="ltr">{order.map((tile, i) => <button key={`${tile}-${i}`} onClick={() => { setOrder(order.filter((_, j) => j !== i)); setUsedTiles(usedTiles.filter(value => value !== tile)); }}>{sentenceTokens[tile]}</button>)}</p><div className="order-tiles" lang="es" dir="ltr">{sentenceTokens.map((token, tile) => <button key={tile} disabled={usedTiles.includes(tile)} onClick={() => { setUsedTiles([...usedTiles, tile]); setOrder([...order, tile]); }}>{token}</button>)}</div><button className="primary-button" onClick={checkOrder} disabled={selected === 'correct'}>تحقق من الجملة <Check size={16}/></button></> : <><h2>{game.id === 'listen' ? 'اسمع واختر المعنى' : question.prompt}</h2>{game.id === 'listen' && <button className="game-listen-button" onClick={() => speakSpanish(question.spanish)}><Volume2 size={18}/> شغّل الصوت الإسباني</button>}{game.id !== 'listen' && question.spanish && <p className="game-prompt-spanish" lang="es" dir="ltr">{question.spanish}</p>}<div className="game-answer-grid">{choices.map((option, i) => <button key={option} dir={/[A-Za-zÀ-ÿ]/.test(option) ? 'ltr' : 'rtl'} disabled={selected !== null} className={`${selected && option === question.correct ? 'is-correct' : ''} ${selected === 'wrong' && answerChoice === option ? 'is-wrong' : ''}`} onClick={() => mark(option)}><span>{['A','B','C','D'][i]}</span>{option}</button>)}</div></>}
      {feedback && <div className={`game-live-feedback ${selected === 'wrong' ? 'bad' : selected === 'correct' || feedback.startsWith('تطابق') ? 'good' : ''}`}>{feedback}</div>}{game.id !== 'match' && <button className="game-next-button" onClick={next}>{game.id === 'order' ? 'الجملة التالية' : 'السؤال التالي'} <ArrowLeft size={16}/></button>}
    </section>}</div>;
}
function GamesPage({ stage, addXp }) {
  const [lessonId, setLessonId] = useState(currentLessons(stage)[0]?.id || '');
  const [activeGame, setActiveGame] = useState(null);
  const lessons = currentLessons(stage);
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  useEffect(() => { setLessonId(currentLessons(stage)[0]?.id || ''); setActiveGame(null); }, [stage]);
  if (activeGame && lesson) return <GameRun key={`${activeGame.id}-${lesson.id}`} game={activeGame} lesson={lesson} stage={stage} onBack={() => setActiveGame(null)} onAward={addXp}/>;
  return <div className="arcade-page"><section className="games-banner"><div><span className="eyebrow"><Gamepad2 size={15}/> صالة الألعاب · {stage}</span><h2>اختار المحاضرة، وبعدها اللعبة</h2><p>كل لعبة تفتح بنظامها الخاص وبنك أسئلة من محتوى المحاضرة.</p></div><div className="game-emoji">🕹️</div></section><div className="arcade-controls"><label className="course-select"><span>محاضرتك</span><select value={lessonId} onChange={event => setLessonId(event.target.value)}>{lessons.map(item => <option key={item.id} value={item.id}>{item.heading}</option>)}</select></label><span className="arcade-selected-lesson">{lesson?.objective}</span></div><div className="arcade-grid">{gameCatalog.map(game => <article className="arcade-game-card" key={game.id}><span className="arcade-game-icon">{game.icon}</span><span className="game-kicker">{stage} · {lesson?.heading.split(' · ').at(-1)}</span><h3>{game.title}</h3><p>{game.description}</p><button className="primary-button" onClick={() => setActiveGame(game)}>ابدأ اللعبة <Play size={15} fill="currentColor"/></button></article>)}</div></div>;
}
function FlashcardsPage({ stage, savedWords, onSaveWord }) {
  const lessons = currentLessons(stage);
  const [lessonId, setLessonId] = useState(lessons[0]?.id || '');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const lesson = lessons.find(item => item.id === lessonId) || lessons[0];
  const words = (lesson?.words || []).filter(word => !savedOnly || savedWords.includes(word.es));
  const current = words[index];
  useEffect(() => { setLessonId(currentLessons(stage)[0]?.id || ''); setIndex(0); setFlipped(false); }, [stage]);
  useEffect(() => { setIndex(0); setFlipped(false); }, [lessonId, savedOnly]);
  function step(amount) { setIndex(value => (value + amount + words.length) % words.length); setFlipped(false); }
  return <div className="flashcards-page"><section className="course-page-intro"><span className="eyebrow"><Bookmark size={15}/> بنك الكلمات · {stage}</span><h2>Flashcards</h2><p>اقلب البطاقة لمشاهدة المعنى، احفظها في «كلماتي»، وراجعها بأي ترتيب.</p><label className="course-select"><span>المحاضرة</span><select value={lessonId} onChange={event => setLessonId(event.target.value)}>{lessons.map(item => <option key={item.id} value={item.id}>{item.heading}</option>)}</select></label><div className="flashcard-filter"><button className={!savedOnly ? 'selected' : ''} onClick={() => setSavedOnly(false)}>كل كلمات المحاضرة</button><button className={savedOnly ? 'selected' : ''} onClick={() => setSavedOnly(true)}>المحفوظة فقط ({(lesson?.words || []).filter(word => savedWords.includes(word.es)).length})</button></div></section>
    {current ? <><div className="flashcard-progress">بطاقة {index + 1} من {words.length}<button onClick={() => { setIndex(Math.floor(Math.random() * words.length)); setFlipped(false); }}><Shuffle size={15}/> اخلط</button></div><button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(value => !value)} aria-label="اقلب البطاقة"><span className="flashcard-side-label">{flipped ? 'المعنى والمثال' : 'الإسبانية'}</span>{!flipped ? <><b lang="es" dir="ltr">{current.es}</b><small>اضغط لقلب البطاقة</small></> : <><b className="flashcard-arabic" dir="rtl">{current.ar}</b><span className="flashcard-example" lang="es" dir="ltr">{lesson?.example}</span><small className="flashcard-example-ar">{lesson?.translation}</small></>}</button><div className="flashcard-controls"><button className="secondary-button" onClick={() => step(-1)}><ArrowRight size={16}/> السابق</button><button className="secondary-button" onClick={() => speakSpanish(current.es)}><Volume2 size={16}/> اسمع</button><button className="secondary-button" onClick={() => onSaveWord(current.es)}><Bookmark size={16} fill={savedWords.includes(current.es) ? 'currentColor' : 'none'}/>{savedWords.includes(current.es) ? 'محفوظة' : 'احفظ الكلمة'}</button><button className="primary-button" onClick={() => step(1)}>التالي <ArrowLeft size={16}/></button></div></> : <div className="empty-state flashcard-empty">مافيش كلمات محفوظة للمحاضرة دي. احفظ كلمات من المحاضرة أو ارجع لكل الكلمات.</div>}</div>;
}
function App() {
  const initial = useMemo(readSaved, []);
  const [active, setActive] = useState('home');
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonLevel, setLessonLevel] = useState('A1');
  const [lessonId, setLessonId] = useState('A1-0');
  const [a1CourseMode, setA1CourseMode] = useState(false);
  const [a1CourseIndex, setA1CourseIndex] = useState(initial.a1CourseIndex ?? 0);
  const [selectedStage, setSelectedStage] = useState(initial.selectedStage || 'A1.1');
  const [displayName, setDisplayName] = useState(initial.displayName || 'متعلم');
  const [xp, setXp] = useState(initial.completedLessons ? (initial.xp ?? 0) : 0);
  const [doneLessons, setDoneLessons] = useState(initial.completedLessons ? (initial.doneLessons ?? 0) : 0);
  const [completedLessons, setCompletedLessons] = useState(initial.completedLessons || []);
  const [savedWords, setSavedWords] = useState(initial.savedWords || []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => { localStorage.setItem('hola-progress', JSON.stringify({ xp, doneLessons, completedLessons, savedWords, a1CourseIndex, selectedStage, displayName })); }, [xp, doneLessons, completedLessons, savedWords, a1CourseIndex, selectedStage, displayName]);
  function openLesson(level = selectedStage.startsWith('A2') ? 'A2' : 'A1', id = currentLessons(selectedStage)[0]?.id || 'A1-0') {
    setA1CourseMode(false); setLessonLevel(level); setLessonId(id); setLessonOpen(true);
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
    if (active === 'path') return <PathPage selectedStage={selectedStage} completedLessons={completedLessons} onOpenLesson={openLesson} onStartA1Course={startA1Course}/>;
    if (active === 'lessons') return <LessonsPage stage={selectedStage} onSelectStage={setSelectedStage} completedLessons={completedLessons} onOpenLesson={openLesson}/>;
    if (active === 'grammar') return <GrammarPage stage={selectedStage}/>;
    if (active === 'listening') return <ListeningPage stage={selectedStage}/>;
    if (active === 'speaking') return <SpeakingPage stage={selectedStage}/>;
    if (active === 'games') return <GamesPage stage={selectedStage} addXp={amount => setXp(value => value + amount)}/>;
    if (active === 'quiz') return <LearningFlow key={`quiz-${selectedStage}`} stage={selectedStage} onFinish={amount => setXp(value => value + amount)}/>;
    if (active === 'exam') return <LearningFlow key={`exam-${selectedStage}`} stage={selectedStage} exam onFinish={amount => setXp(value => value + amount)}/>;
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
  </div>;
}
export default App;
