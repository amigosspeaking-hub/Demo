#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { lessonLibrary } from '../src/data/lessons.js';
import bookActivities from '../src/data/bookActivities.json' with { type: 'json' };
import { courseBookMaterials } from '../src/data/courseMaterials.js';
import { listeningArabicTranscripts } from '../src/data/listeningArabic.js';
import { isSpanishText, transcriptSegments } from '../src/data/listeningTranscriptUtils.js';
import { buildListeningItems, transcriptText } from '../src/data/listening.js';
import * as grammarGuides from '../src/data/grammar.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

const items = buildListeningItems(lessonLibrary);
const itemIds = new Set(items.map((item) => item.id));
check(items.length === 20, `Expected 20 local lesson examples; found ${items.length}`);
check(itemIds.size === items.length, 'Listening example IDs must be unique');
check(items.filter((item) => item.level === 'A1').length === 10, 'Expected 10 A1 examples');
check(items.filter((item) => item.level === 'A2').length === 10, 'Expected 10 A2 examples');
const originalAudioTracks = Object.values(bookActivities.stages || {}).flatMap((stage) => stage.listen?.tracks || []);
check(Object.keys(listeningArabicTranscripts).length === originalAudioTracks.length, 'Every imported listening audio track must have a complete Arabic transcript');
for (const original of originalAudioTracks) {
  const { file } = original;
  const arabic = listeningArabicTranscripts[file];
  check(Boolean(arabic), `${file}: complete Arabic transcript must be present`);
  const sourceSegments = transcriptSegments(original.es, file);
  const translatedSegments = arabic.split('\n');
  check(translatedSegments.length === sourceSegments.length, `${file}: every Spanish spoken turn / phrase must have one opposite Arabic translation`);
  check(translatedSegments.every((line) => line.trim()), `${file}: Arabic transcript must not contain missing/blank lines`);
  check(translatedSegments.every((line) => /[\u0600-\u06ff]/u.test(line)), `${file}: every translated turn must contain Arabic, not a section number or untranslated Spanish-only placeholder`);
}
check(Object.keys(listeningArabicTranscripts).every((file) => originalAudioTracks.some((track) => track.file === file)), 'Arabic transcript data must not contain orphaned audio entries');

for (const item of items) {
  const lesson = lessonLibrary[item.id];
  check(Boolean(lesson), `Missing source lesson for ${item.id}`);
  check(item.spanish === lesson.example.trim(), `${item.id}: Spanish text must match local lesson content`);
  check(item.arabic === lesson.translation.trim(), `${item.id}: Arabic translation must match local lesson content`);
  check(transcriptText(item, 'ar') === lesson.translation.trim(), `${item.id}: Arabic tab must render the full translation only`);
  check(transcriptText(item, 'es') === lesson.example.trim(), `${item.id}: Spanish tab must render the full example only`);
  check(/[\u0600-\u06ff]/u.test(item.arabic), `${item.id}: Arabic translation must contain Arabic text`);
  check(/[A-Za-zÀ-ÿ]/u.test(item.spanish), `${item.id}: Spanish example must contain Spanish text`);
  check(!/(?:\b(?:actividad|unidad|unit|activity)\b|النشاط|الوحدة)/iu.test(item.arabic), `${item.id}: activity/unit labels must not be embedded in Arabic translation`);
  check(!/^A\d(?:\.\d)?\s*[·—-]/u.test(item.title), `${item.id}: title must not carry a level/unit prefix`);
  for (const word of lesson.words) {
    check(Boolean(word.es?.trim()), `${item.id}: Spanish vocabulary entry must not be empty`);
    check(Boolean(word.ar?.trim()), `${item.id}: Arabic vocabulary entry must not be empty`);
    check(Boolean(word.say?.trim()), `${item.id}: pronunciation hint must not be empty`);
  }
}

const localDataSource = await readFile(path.join(root, 'src/data/lessons.js'), 'utf8');
check(!/drive\.google\.com|transcripts_v17/i.test(localDataSource), 'Local translation source must not link to the Drive Spanish transcript');
const appSource = await readFile(path.join(root, 'src/App.jsx'), 'utf8');
check(!/اسألي|تسألي|اتكلمي|وصّفي|اطلبي|تطلبي|مستعدة|فاهمة/u.test(JSON.stringify(lessonLibrary)), 'Lesson objectives and prompts must address the learner in masculine wording');
const listeningSource = appSource.slice(appSource.indexOf('function ListeningPage('), appSource.indexOf('function SpeakingPage('));
check(listeningSource.includes('<BookListeningLibrary stage={stage} focusLessonId={focusLessonId}/>'), 'Listening must open the selected lesson recording library');
check(!/SpeechSynthesisUtterance|buildListeningItems\(lessonLibrary\)/.test(listeningSource), 'Listening must not substitute synthesized lesson-library examples for book recordings');
check(appSource.includes('function NativeListeningExercises(') && appSource.includes('track.q.map'), 'Original listening activities must use the questions bundled with each source recording');
const originalListeningQuestionsSource = appSource.slice(appSource.indexOf('function NativeListeningExercises('), appSource.indexOf('function OriginalListeningStation('));
check(originalListeningQuestionsSource.includes('<BidiText>{item.q}</BidiText>') && originalListeningQuestionsSource.includes('<BidiText>{option}</BidiText>') && originalListeningQuestionsSource.includes('<ListeningExplanation text={item.ex}/>'), 'Spanish listening prompts, answer options, and quoted explanations must use isolated language direction rather than inheriting RTL');
check(appSource.includes('<BidiText>{sourceQuiz.prompt}</BidiText>') && appSource.includes('<BidiText>{item.prompt}</BidiText>') && appSource.includes('<BidiText>{item.correct}</BidiText>'), 'Every original quiz flow must apply the same language-isolated rendering to Spanish prompts and answer choices');
check(!appSource.includes('الإسباني والعربي سطرًا بسطر'), 'Transcript UI must omit the removed redundant heading');
check(appSource.includes('nativeListeningTrackForLesson') && appSource.includes("transcriptSegments(originalTrack?.es || ''") && appSource.includes('listeningArabicTranscripts[originalTrack?.file]'), 'Original recording transcript and complete Arabic translation must come from imported reader data');
check(appSource.includes('onClick={() => onSaveWord(current.es)}'), 'Saving a lesson word must update the shared vocabulary list');
check(appSource.includes('<BookAudioPlayer key={track.src} track={track}/>') || appSource.includes('<BookAudioPlayer key={track.src} track={track} activePanel={activePanel}'), 'Listening playback must use the local book audio file');
const audioPlayerSource = appSource.slice(appSource.indexOf('function BookAudioPlayer('), appSource.indexOf('function nativeBookUnitForLesson('));
check(audioPlayerSource.includes('player-waveform') && audioPlayerSource.includes('RotateCcw') && audioPlayerSource.includes('player-skip-forward') && audioPlayerSource.includes('ارجع عشر ثوانٍ'), 'Listening player must provide a waveform and recognizable ten-second rewind/forward controls');
check(audioPlayerSource.includes('التفريغ والترجمة') && audioPlayerSource.includes('الملخص بالعربي') && audioPlayerSource.includes('أسئلة الاستماع') && audioPlayerSource.includes('aria-pressed'), 'Listening player must expose separate accessible transcript, summary and exercise buttons');
check(!audioPlayerSource.includes('تسجيل أصلي من مادة المحاضرة'), 'Player must not repeat the removed session caption');
const listeningPlayerStationSource = appSource.slice(appSource.indexOf('function OriginalListeningStation('), appSource.indexOf('function BookLessonMaterials('));
check(listeningPlayerStationSource.includes('listening-track-list') && listeningPlayerStationSource.includes("activePanel === 'transcript'") && listeningPlayerStationSource.includes("activePanel === 'exercises'"), 'Listening station must provide a selectable playlist and separately toggled transcript and exercise views');
const lessonPickerSource = appSource.slice(appSource.indexOf('function ListeningLessonPicker('), appSource.indexOf('function BookListeningLibrary('));
check(lessonPickerSource.includes('role="listbox"') && lessonPickerSource.includes('role="option"') && lessonPickerSource.includes('lang="es" dir="ltr"') && !lessonPickerSource.includes('<select'), 'Listening lesson selector must be a custom Spanish-direction-safe dropdown, not a mirrored native select');
check(!listeningPlayerStationSource.includes('تسجيلات محلية أصلية') && !listeningPlayerStationSource.includes('من صوت الكتاب') && listeningPlayerStationSource.includes('من صوتيات الكتاب') && !appSource.includes('التسجيل من ملفات الكتاب الأصلية. لا يتوفر له تفريغ أو بنك أسئلة رقمي موثّق'), 'Listening station must use the revised source wording and omit the removed availability disclaimer');
check(listeningPlayerStationSource.includes('transcript-paired-rows') && listeningPlayerStationSource.includes('<p lang="es" dir="ltr">{line}</p><p lang="ar" dir="rtl">{arabicTranscriptLines[index]}</p>') && listeningPlayerStationSource.includes('العربية · الترجمة الكاملة') && !listeningPlayerStationSource.includes('transcript-key-pairs'), 'Each Spanish spoken turn must sit beside its full Arabic translation in the same two-cell row');
check(listeningPlayerStationSource.includes('transcriptSegments(sourceTrack?.es') && listeningPlayerStationSource.includes('listeningArabicTranscripts[sourceTrack?.file]') && listeningPlayerStationSource.includes('hasLineAlignedTranslation'), 'Full transcript must be normalized, looked up by audio filename, and rendered only when every turn aligns');
check(listeningPlayerStationSource.includes('hasTranscript={Boolean(sourceTrack?.es && listeningArabicTranscripts[sourceTrack.file])}'), 'Transcript action must be enabled only when the complete Arabic translation exists');
check(audioPlayerSource.includes('hasSummary') && audioPlayerSource.includes('الملخص بالعربي') && listeningPlayerStationSource.includes("activePanel === 'summary'"), 'Arabic summary must open from its own dedicated player button, separate from the transcript');
check(appSource.includes('src={question.audio}') && appSource.includes('nativeQuestionsForLesson(lesson.id).filter(item => item.listening)'), 'Listening game must play actual track audio and use original listening questions');
check(appSource.includes('nativeQuestionsForLesson(lesson.id).filter(item => item.listening)'), 'Listening game question source must stay attached to the original lesson');
check(appSource.includes('function nativeQuestionsForLesson(lessonId)') && appSource.includes('original.quiz?.[unit]'), 'Quiz pools must be sourced from each original book unit');
check(appSource.includes('original.listen?.bank') && appSource.includes('item.tunit === unit'), 'Listening questions in quizzes must retain their source unit');
check(appSource.includes('model?.n || 40') && appSource.includes('model?.minutes || 60'), 'Exam timing and length must come from the original exam model metadata');
const fallbackActivitySource = appSource.slice(appSource.indexOf('function OriginalBookActivityFlow('), appSource.indexOf('function GrammarPage('));
check(fallbackActivitySource.includes('لن نعرض صفحات الكتاب هنا') && fallbackActivitySource.includes('assessment-alternatives') && !fallbackActivitySource.includes('<iframe') && !fallbackActivitySource.includes('reader.src'), 'Stages without a verified digital bank must show an honest designed state with routes to other tools, not book pages or invented questions');
const spanishQuestionFields = [];
function collectSpanishQuestions(value, keyPath = '') {
  if (Array.isArray(value)) value.forEach((item, index) => collectSpanishQuestions(item, `${keyPath}/${index}`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => collectSpanishQuestions(item, `${keyPath}/${key}`));
  else if (typeof value === 'string' && /\/(?:q|es|title)$/u.test(keyPath) && value.includes('?')) spanishQuestionFields.push([keyPath, value]);
}
collectSpanishQuestions(bookActivities);
for (const [keyPath, text] of spanishQuestionFields) {
  check(text.includes('¿'), `${keyPath}: Spanish question mark must open with ¿: ${text.slice(0, 100)}`);
}
check(appSource.includes('function grammarPracticeParts(') && appSource.includes('اكشف الحل') && appSource.includes('grammar-practice-answer'), 'Grammar lessons must include an interactive self-check with a revealable answer');
check(appSource.includes('function GrammarText(') && appSource.includes('grammarInlinePattern') && appSource.includes('hola-grammar-mastery') && appSource.includes('grammar-filter-tabs'), 'Grammar Studio must isolate embedded Spanish and provide searchable, filterable, saved mastery progress');
check(appSource.includes('sentence-of-day-pair') && appSource.includes('speaking-bilingual-prompt') && appSource.includes('flashcard-unit-pair'), 'Daily sentence, speaking prompt, and flashcard unit labels must use explicit Spanish-left / Arabic-right pairs');
const directionStyles = await readFile(path.join(root, 'src/styles.css'), 'utf8');
check(directionStyles.includes('.listening-lesson-menu{right:auto;left:0;direction:ltr') && directionStyles.includes('.listening-lesson-menu button{direction:ltr'), 'Spanish lesson menu must open and read from the physical left');
check(directionStyles.includes('[lang="es"],[lang^="es-"]{direction:ltr') && directionStyles.includes('[lang="ar"],[lang^="ar-"]{direction:rtl'), 'Language-tagged Spanish and Arabic text must receive explicit LTR and RTL direction');
check(directionStyles.includes('.grammar-explanation{display:block') && directionStyles.includes('.grammar-explanation-spanish{display:inline-block') && directionStyles.includes('.grammar-explanation-arabic{color:#52645a') && directionStyles.includes('.grammar-focus-grid{display:grid') && directionStyles.includes('.grammar-hero{position:relative') && directionStyles.includes('.grammar-guide.is-mastered'), 'Grammar Studio must keep mixed Arabic/Spanish explanations in natural inline flow with isolated language direction');
check(grammarGuides.grammarGuides['A1-0'].explanation.includes('[[¿]]') && grammarGuides.grammarGuides['A1-0'].explanation.includes('[[?]]') && !grammarGuides.grammarGuides['A1-0'].explanation.includes('[[؟]]'), 'Spanish questions must use the inverted opening mark and the Spanish closing question mark, not Arabic punctuation');
check(grammarGuides.grammarGuides['A1-0'].explanation.includes('خد بالك') && !grammarGuides.grammarGuides['A1-0'].explanation.includes('خدي بالك'), 'Grammar explanation should address the learner in masculine Egyptian Arabic as requested');
check(appSource.includes('const spanish = marked || /\\p{Script=Latin}/u.test(content)') && appSource.includes('grammar-explanation-spanish-explicit'), 'Punctuation-only Arabic marks must not be auto-classified as Spanish and marked fill-in phrases must remain direction-isolated');
check(!appSource.includes('شرح مصري واضح، أمثلة إسبانية بصوتها، وتدريب قصير يثبت كل قاعدة') && !appSource.includes('تقدّمك محفوظ تلقائيًا على جهازك'), 'Grammar Studio must omit the removed promotional filler');
check(appSource.includes('function SpeakingPage(') && appSource.includes('storySentences.map') && appSource.includes('اسمع القصة كاملة') && appSource.includes('story-vocabulary'), 'Speaking must provide a complete narrated story, aligned bilingual lines, and unit vocabulary');
check(grammarGuides.grammarGuides['A1-1'].practice.includes('[[Yo ___ de Egipto.]]') && grammarGuides.grammarGuides['A1-1'].practice.includes('[[soy.]]') && grammarGuides.grammarGuides['A1-2'].explanation.includes('[[para + infinitivo]]'), 'Grammar practice must keep each complete Spanish example together and preserve accurate infinitive rules');
check(directionStyles.includes('@media(max-width:650px){') && directionStyles.includes('.grammar-focus-grid{grid-template-columns:minmax(0,1fr);gap:7px;}') && directionStyles.includes('.grammar-example-row{grid-template-columns:20px minmax(0,1fr) minmax(0,1fr) 34px;'), 'Grammar explanations and bilingual examples must reflow into contained, readable layouts on narrow screens');
check(directionStyles.includes('.transcript-paired-rows>.transcript-row{min-width:0;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;align-items:stretch') && directionStyles.includes('.transcript-paired-rows>.transcript-row>p[lang="es"]{grid-column:1') && directionStyles.includes('.transcript-paired-rows>.transcript-row>p[lang="ar"]{grid-column:2'), 'Every Spanish/Arabic transcript pair must occupy left/right cells in one equal-height row');
check(directionStyles.includes('.bidi-isolate[lang="es"],.bidi-isolate[lang^="es-"]{direction:ltr;text-align:left;unicode-bidi:isolate-override') && directionStyles.includes('.native-listening-question h4[lang="es"],.native-listening-options button[lang="es"]{direction:ltr;text-align:left'), 'Spanish prompts and answers must be isolated and physically left-aligned so inverted question marks render in LTR order');
check(appSource.includes('answer-spanish-inline') && directionStyles.includes('.bidi-isolate.answer-spanish-inline[lang="es"]{display:inline!important;width:auto;max-width:none') && directionStyles.includes('unicode-bidi:isolate;color:inherit;'), 'Spanish fragments embedded in Arabic answers must stay transparent, isolated, and inline');
check(appSource.includes('lesson-return-top-button') && directionStyles.includes('.lesson-modal-reader .lesson-reader-topbar{position:sticky') && appSource.includes('onClick={() => setReaderOpen(false)}'), 'The lesson-reader return action must remain visible in the upper toolbar');
check(directionStyles.includes('.native-flashcard-selectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))') && directionStyles.includes('.native-flashcard-tabs{display:flex;align-items:stretch;flex-wrap:wrap') && directionStyles.includes('@media(max-width:700px){\n  .native-flashcards-intro') && directionStyles.includes('.native-flashcard-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'), 'Review-card selectors, tabs, and controls must reflow without crowding on narrow screens');
check(directionStyles.includes('.player-study-actions button.selected:hover:not(:disabled){border-color:#a92329;background:#a92329;color:#fff'), 'Selected listening actions must remain legible on hover');
check(directionStyles.includes('.transcript-paired-rows>.transcript-row>p{min-width:0;max-width:100%;height:100%') && directionStyles.includes('.listening-tool-panel{width:100%;min-width:0;max-width:100%;overflow:hidden'), 'Paired transcript rectangles and text must stay contained without horizontal overflow');
check(directionStyles.includes('.book-audio-controls>button.player-play-button{width:60px;height:60px') && directionStyles.includes('border-radius:50%'), 'The central media-play control must remain circular and prominent despite generic audio button rules');
const listeningStationSource = appSource.slice(appSource.indexOf('function OriginalListeningStation('), appSource.indexOf('function BookLessonMaterials('));
check(listeningStationSource.includes('<BookAudioPlayer') && listeningStationSource.includes('<NativeListeningExercises') && !listeningStationSource.includes('book-page-preview') && !listeningStationSource.includes('.pages'), 'Listening station must offer original audio and exercises without embedding textbook pages');
check(!listeningSource.includes('BookLessonMaterials') && !listeningSource.includes('book-page-preview') && !listeningSource.includes('listening-hero-tags'), 'Listening page must stay independent of book scans and avoid the removed decorative tag chips');
check(appSource.includes('onClick={() => restart()}'), 'Restart button must restart with the currently selected scope');
check(!appSource.includes('window.location.reload()'), 'Game flow must return to the arcade without reloading the entire app');
check(appSource.includes('window.SpeechRecognition || window.webkitSpeechRecognition'), 'Speaking UI must use the browser microphone recognition API');
check(appSource.includes('const gameCatalog = [') && appSource.includes('function GameRun('), 'Arcade must offer separate playable game modes');
check(appSource.includes("id: 'match'") && appSource.includes("id: 'quiz'") && appSource.includes("id: 'listen'") && appSource.includes("id: 'storyListen'") && appSource.includes("id: 'order'"), 'Arcade must expose distinct vocabulary, quiz, original-audio, story-audio, and sentence-building games');
check(appSource.includes('const arcadeModes = [') && appSource.includes("id: 'practice'") && appSource.includes("id: 'challenge'") && appSource.includes("id: 'sprint'") && appSource.includes("hola-arcade-records"), 'Arcade must provide practice/challenge/sprint systems and persistent per-game records');
check(appSource.includes('matchBankForLesson') && appSource.includes('storyListeningBank') && appSource.includes('orderBankForLesson') && appSource.includes('grammarQuestions') && appSource.includes('storyQuestions'), 'Every arcade mode must draw from a separate lesson-specific bank');
check(appSource.includes('const seenSpanish = new Set()') && appSource.includes('const seenArabic = new Set()'), 'Vocabulary matching must not pair duplicate Spanish or Arabic labels');
check(appSource.includes('اختار معنى المثال: ${es}') && appSource.includes('arcadeRoundLimit(game.id, mode)') && appSource.includes('shuffled(bank).slice(0, roundCount)'), 'Quiz prompts must present actual Spanish grammar examples and cap shuffled rounds to the available lesson bank');
check(appSource.includes('function GamePromptText(') && appSource.includes('<GamePromptText text={option}/>') && appSource.includes('<GamePromptText text={feedback.detail}/>'), 'Mixed Arabic and Spanish game prompts, answers, and feedback must isolate each language direction');
const homeSource = appSource.slice(appSource.indexOf('function HomePage('), appSource.indexOf('function PathPage('));
check(homeSource.includes('find(lesson => !completedLessons.includes(lesson.id))'), 'Home primary action must continue the next unfinished lesson in the selected stage');
check(homeSource.includes('courseBookMaterials[nextLesson?.id]?.pages?.[0]'), 'Home feature area must use a real local textbook scan');
check(homeSource.includes('home-lesson-list') && homeSource.includes('completedCount} من {courseLessons.length}'), 'Home must show the selected stage lessons and a compact, accurate progress summary');
check(!homeSource.includes('daily-card') && !homeSource.includes('word-feature') && !homeSource.includes('grammar-card'), 'Home must not duplicate the challenge, word-of-day, and grammar panels');
check(appSource.includes('function LessonCard(') && appSource.includes('lesson-card-cover') && appSource.includes('material?.tracks?.length'), 'Lesson cards must include book previews and locally mapped audio metadata');
check(appSource.includes('const mobileNavItems = [') && appSource.includes("{ id: 'games', label: 'الألعاب'"), 'Mobile navigation must keep a small set of primary destinations');
check(appSource.includes('<span>المزيد</span>') && appSource.includes('aria-expanded={mobileMenuOpen}'), 'Secondary sections must remain accessible through the expandable More menu');
check(!homeSource.includes('addXp(') && !homeSource.includes('gracias'), 'Home must not award repeatable XP or show unrelated fixed-level content');
check(homeSource.includes('sentenceOfTheDay(selectedStage)') && homeSource.includes('sentence-of-day-card'), 'Home must show a daily sentence card');
check(appSource.includes('function sentenceOfTheDay(') && appSource.includes('bookActivities.stages') && appSource.includes('Date.UTC'), 'Daily sentence must rotate by local calendar day using original book content');
const flashcardsSource = appSource.slice(appSource.indexOf('function FlashcardsPage('), appSource.indexOf('function App('));
check(flashcardsSource.includes('sourceStage?.flash?.[sourceUnitId]') && flashcardsSource.includes("deck?.sentences || []") && flashcardsSource.includes("deck?.words || []"), 'Flashcards must use the extracted source-book words and sentences');
check(!flashcardsSource.includes('lesson?.words'), 'Flashcards must not fall back to lesson-library examples');
for (const [stageId, minimumCards] of [['A1.1', 60], ['A1.2', 45], ['A1.3', 45]]) {
  const flash = bookActivities.stages?.[stageId]?.flash || {};
  const cardCount = Object.values(flash).reduce((total, deck) => total + (deck.words?.length || 0) + (deck.sentences?.length || 0), 0);
  check(cardCount >= minimumCards, `${stageId}: extracted original flashcards must include words and sentences`);
}
const readerImportSource = await readFile(path.join(root, 'scripts/import-book-readers.py'), 'utf8');
check(readerImportSource.includes('#tabs,.tabs{display:none!important;}'), 'Book reader imports must hide the unit tab bars in every embedded reader');
check(readerImportSource.includes('def strip_alt_digital_from_index') && readerImportSource.includes('html = strip_alt_digital_from_index(html)'), 'Book reader imports must remove ALT | DIGITAL from all learner-facing index metadata');
const directReaderStyleSource = await readFile(path.join(root, 'src/components/direct-reader.css'), 'utf8');
check(directReaderStyleSource.includes('.direct-book-reader iframe') && directReaderStyleSource.includes('height: 100%') && appSource.includes('function installReaderReturnControl(') && appSource.includes("querySelector('.top1')"), 'Full-screen reader return button must be injected inside the book reader’s existing top toolbar');
const readerReturnSource = appSource.slice(appSource.indexOf('function installReaderReturnControl('), appSource.indexOf('function DirectOriginalBookReader('));
check(readerReturnSource.includes('toolbar.appendChild(button)') && readerReturnSource.includes('toolbar.style.position = \'relative\'') && !readerReturnSource.includes('toolbar.style.display') && !readerReturnSource.includes('toolbar.style.transition'), 'Reader return control must preserve the original toolbar visibility and show/hide transition behavior');
for (const reader of ['A1.1', 'A1.2', 'A1.3', 'A2.1', 'A2.2', 'A2.3']) {
  const readerHtml = await readFile(path.join(root, `public/materials/readers/${reader}/index.html`), 'utf8');
  check(readerHtml.includes('#tabs,.tabs{display:none!important;}'), `${reader}: unit tab bar must be hidden in the lesson reader`);
  const idxStart = readerHtml.indexOf('const IDX = ');
  const idxEnd = readerHtml.indexOf(';\n', idxStart);
  check(idxStart >= 0 && idxEnd > idxStart && !/ALT\s*\|\s*DIGITAL/i.test(readerHtml.slice(idxStart, idxEnd)), `${reader}: production labels must be absent from its table-of-contents metadata`);
}

check(appSource.includes('selectedStage, displayName') && appSource.includes("useState(initial.selectedStage || 'A1.1')"), 'Profile stage selection must persist locally');
check(!/drive\.google\.com/i.test(appSource), 'Learner-facing pages must not send students to Google Drive');
check(appSource.includes('function BookLessonMaterials(') && appSource.includes('<BookLessonMaterials lessonId={lessonId}/>'), 'Each mapped lesson must open its own original book pages and audio in-app');
check(appSource.includes('<BookListeningLibrary stage={stage} focusLessonId={focusLessonId}/>'), 'Listening page must expose only original audio mapped to the selected course stage');
check(appSource.includes('onClick={() => changeRate(value)}') && appSource.toLowerCase().includes('versión alternativa'), 'Original audio player must provide speed choices and explicit alternate-track labels');
check(!/window\.open\(|target=["']_blank/i.test(appSource), 'Course material playback must stay inside the application');
check(Object.keys(courseBookMaterials).length === 20, 'Imported book resources must map all 20 A1 and A2.1–A2.3 lessons');
check(courseBookMaterials['A1-0']?.pages[0]?.page === 10 && courseBookMaterials['A1-9']?.pages.at(-1)?.page === 139, 'A1 page ranges must follow the actual three archived course units');
check(courseBookMaterials['A2-1']?.pages[0]?.page === 10 && courseBookMaterials['A2-4']?.pages.at(-1)?.page === 65, 'A2.1 pages must follow the four units actually present in its ready-to-website archive');
check(courseBookMaterials['A2-5']?.pages[0]?.page === 66 && courseBookMaterials['A2-8']?.pages[0]?.page === 108 && courseBookMaterials['A2-8']?.pages.some(item => item.page === 206), 'A2.2 lesson materials must include units 5–8 plus their linked grammar and exercise pages');
check(courseBookMaterials['A2-9']?.pages[0]?.page === 122 && courseBookMaterials['A2-10']?.pages[0]?.page === 136 && courseBookMaterials['A2-10']?.pages.some(item => item.page === 947), 'A2.3 lesson materials must include units 9–10 plus their linked transcript pages');
check(courseBookMaterials['A2-5']?.tracks.length === 18 && courseBookMaterials['A2-10']?.tracks.length === 8, 'A2.2 and A2.3 materials must map their verified primary and alternate recordings');
const readerManifest = JSON.parse(await readFile(path.join(root, 'public/materials/readers/reader-manifest.json'), 'utf8'));
const expectedReaders = { 'A1.1': [121, 12, 64], 'A1.2': [81, 9, 48], 'A1.3': [79, 11, 48], 'A2.1': [56, 15, 0], 'A2.2': [114, 46, 0], 'A2.3': [62, 12, 0] };
for (const [course, [pageCount, audioTracks, quizQuestions]] of Object.entries(expectedReaders)) {
  const reader = readerManifest[course];
  check(Boolean(reader), `${course}: original in-app reader must be present`);
  check(reader.pageCount === pageCount && reader.pageNumbers.length === pageCount, `${course}: reader scan count must match the locally installed pages`);
  check(reader.audioTracks === audioTracks && reader.interactiveQuizQuestions === quizQuestions, `${course}: preserved reader activity metadata must match the inspected source`);
  check(existsSync(path.join(root, 'public', reader.url)), `${course}: in-app reader route must be a real file`);
  check(reader.pageNumbers.every((page) => {
    const asset = reader.pageAssets?.[String(page)] || `p${String(page).padStart(3, '0')}.webp`;
    return existsSync(path.join(root, 'public/materials/books', course, 'pages', asset));
  }), `${course}: every reader page must resolve to its original local scan`);
  if (course.startsWith('A1.')) {
    check(Array.isArray(reader.missingIndexedTranscriptPages), `${course}: manifest must disclose unavailable indexed transcript scans`);
    check(reader.pageNumbers.every(page => !reader.missingIndexedTranscriptPages.includes(page)), `${course}: unavailable transcript scans must not be exposed as working pages`);
    const transcriptPages = reader.pageNumbers.filter(page => page >= 1001 && page <= 1032);
    check(transcriptPages.every(page => reader.pageAssets[String(page)]?.startsWith('t')), `${course}: transcript page IDs must map to the source transcript image filenames`);
  }
  const readerHtml = await readFile(path.join(root, 'public', reader.url), 'utf8');
  check(readerHtml.includes('كل الإجابات') && readerHtml.includes('فهرس الوحدة'), `${course}: original answer controls and unit index must remain in the reader`);
  check(!/youtube\.com|youtu\.be|drive\.google/i.test(readerHtml), `${course}: reader must not send the learner to external video or Drive pages`);
  if (course.startsWith('A1.')) check(!readerHtml.includes('src="pages/'), `${course}: static and fallback page templates must use local optimized scans`);
  const readerStyles = course.startsWith('A1.') ? await readFile(path.join(root, 'public/materials/readers', course, 'tabs_style.css'), 'utf8') : readerHtml;
  check(readerStyles.includes('#editBtn,#openAdmin,#adminPanel,#editTray{display:none!important;}'), `${course}: teacher editing and admin controls must stay hidden from learners`);
  const inlineScripts = [...readerHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  for (const [, attributes, code] of inlineScripts) {
    if (/\bsrc=/i.test(attributes) || !code.trim()) continue;
    const syntax = spawnSync(process.execPath, ['--check', '-'], { input: code, encoding: 'utf8' });
    check(syntax.status === 0, `${course}: embedded reader script must parse (${syntax.stderr.trim()})`);
  }
  if (course.startsWith('A1.')) {
    for (const filename of ['tabs_data.js', 'tabs_engine.js']) {
      const code = await readFile(path.join(root, 'public/materials/readers', course, filename), 'utf8');
      const syntax = spawnSync(process.execPath, ['--check', '-'], { input: code, encoding: 'utf8' });
      check(syntax.status === 0, `${course}: ${filename} must parse (${syntax.stderr.trim()})`);
    }
  }
}
check(appSource.includes('function OriginalBookReader(') && appSource.includes('sandbox="allow-scripts allow-same-origin"'), 'Original reader must stay sandboxed and embedded inside the lesson dialog');
check(appSource.includes('function PathPage(') && appSource.includes('const sequence = [') && appSource.includes('island-steps'), 'Learning path must render lesson-by-lesson islands with their own ordered activity sequence');
const islandSteps = ['lesson', 'grammar', 'listening', 'games', 'speaking', 'quiz', 'exam'];
const islandDefinition = appSource.slice(appSource.indexOf('const sequence = ['), appSource.indexOf('];', appSource.indexOf('const sequence = [')));
check(islandSteps.every((step, index) => islandDefinition.indexOf(`id: '${step}'`) >= 0 && (index === 0 || islandDefinition.indexOf(`id: '${step}'`) > islandDefinition.indexOf(`id: '${islandSteps[index - 1]}'`))), 'Every island must follow lesson → grammar → listening → games → speaking → quiz → exam order');
check(appSource.includes('function originalReaderForLesson(') && appSource.includes('/materials/readers/${course}/index.html?unit='), 'Each lesson must open its reader restricted to its unit, not the whole stage');
check(appSource.includes('readerUnitsForLesson') && appSource.includes('encodeURIComponent(units.join(','))'), 'A lesson reader URL must include only the mapped unit key(s)');
check(appSource.includes("index >= 5 && index <= 8 ? 'A2.2'") && appSource.includes("index >= 9 && index <= 10 ? 'A2.3'"), 'A2 lessons 5–10 must open the restored A2.2 and A2.3 in-app readers');
const importerSource = await readFile(path.join(root, 'scripts/import-book-readers.py'), 'utf8');
check(importerSource.includes('def add_lesson_unit_filter') && importerSource.includes('UNITS.filter(unit => __lessonUnitKeys.has(unit.k))'), 'Reader import must preserve unit-only filtering in future imports');
for (const stage of Object.keys(expectedReaders)) { const html = await readFile(path.join(root, `public/materials/readers/${stage}/index.html`), 'utf8'); check(html.includes('__lessonUnitKeys') && html.includes('PAGES.splice'), `${stage}: reader must filter page navigation to one lesson when a unit is requested`); }

const grammarDetails = await import('../src/data/grammarDetails.js');
const lessonStories = await import('../src/data/stories.js');
const sentenceBanks = await import('../src/data/sentences.js');
for (const lessonId of Object.keys(lessonLibrary)) {
  check(Boolean(grammarGuides.grammarGuides[lessonId]?.explanation), `${lessonId}: detailed grammar guide must exist`);
  const grammarPractice = grammarGuides.grammarGuides[lessonId]?.practice || '';
  if (grammarPractice.includes('___')) check(/\[\[[^\]]*___[^\]]*\]\]/u.test(grammarPractice), `${lessonId}: the complete Spanish sentence around a fill-in blank must be direction-isolated`);
  check(grammarDetails.grammarDetails[lessonId]?.length >= 3, `${lessonId}: the grammar guide must include at least three lesson-specific subtopics`);
  const story = lessonStories.lessonStories[lessonId];
  check(story?.title && story.sentences?.length >= 5, `${lessonId}: a complete, lesson-specific speaking story must have at least five sentences`);
  check(story.sentences.every(sentence => sentence.es?.trim() && /[\u0600-\u06ff]/u.test(sentence.ar || '')), `${lessonId}: every Spanish story sentence must have its corresponding Arabic line`);
  check(sentenceBanks.lessonSentenceBanks[lessonId]?.length >= 3, `${lessonId}: independent sentence game bank must contain multiple prompts`);
  const matchCandidates = [...lessonLibrary[lessonId].words, ...(grammarDetails.grammarDetails[lessonId] || []).map(topic => ({ es: topic.es, ar: topic.ar })), ...(grammarGuides.grammarGuides[lessonId]?.examples || []).map(([es, ar]) => ({ es, ar }))];
  check(new Set(matchCandidates.filter(item => item.es && item.ar).map(item => `${item.es} :: ${item.ar}`)).size >= 7, `${lessonId}: vocabulary matching needs a substantial lesson-specific pair bank`);
  const orderBank = [lessonLibrary[lessonId].example, ...(sentenceBanks.lessonSentenceBanks[lessonId] || []), ...story.sentences.map(sentence => sentence.es)];
  check(new Set(orderBank.filter(Boolean)).size >= 8, `${lessonId}: sentence-building needs enough distinct phrases for varied rounds`);
  check(lessonLibrary[lessonId].words.length + 1 + (grammarGuides.grammarGuides[lessonId]?.examples?.length || 0) + story.sentences.length >= 10, `${lessonId}: quiz bank must combine vocabulary, grammar, lesson, and story questions`);
}

const materials = [
  { id: 'A1.1', ids: ['A1-0', 'A1-1', 'A1-2', 'A1-3'] },
  { id: 'A1.2', ids: ['A1-4', 'A1-5', 'A1-6'] },
  { id: 'A1.3', ids: ['A1-7', 'A1-8', 'A1-9'] },
  { id: 'A2.1', ids: ['A2-1', 'A2-2', 'A2-3', 'A2-4'] },
  { id: 'A2.2', ids: ['A2-5', 'A2-6', 'A2-7', 'A2-8'] },
  { id: 'A2.3', ids: ['A2-9', 'A2-10'] },
];
for (const material of materials) {
  const file = path.join(root, 'public/materials', material.id, 'activity-data.json');
  const data = JSON.parse(await readFile(file, 'utf8'));
  check(data.material === material.id, `${material.id}: material identifier must match folder`);
  check(data.itemCount === material.ids.length, `${material.id}: itemCount must match generated activities`);
  check(JSON.stringify(data.activities.map((activity) => activity.id)) === JSON.stringify(material.ids), `${material.id}: examples must follow the local course map`);
  check(data.activities.every((activity) => activity.translationArabic === lessonLibrary[activity.id].translation.trim()), `${material.id}: Arabic material text must remain sourced from local lessons`);
  check(data.activities.every((activity) => !/(?:\b(?:actividad|unidad|unit|activity)\b|النشاط|الوحدة)/iu.test(activity.translationArabic)), `${material.id}: Arabic text must not contain activity/unit labels`);
}

const translations = JSON.parse(await readFile(path.join(root, 'scripts/listening-translations.json'), 'utf8'));
check(translations.source === 'src/data/lessons.js', 'Translation export must declare the local project source');
check(translations.itemCount === items.length, 'Translation export count must match local examples');
check(translations.items.every((item) => item.arabic === lessonLibrary[item.id].translation.trim()), 'Translation export must preserve full local Arabic examples');
check(!JSON.stringify(translations).includes('drive.google.com'), 'Translation export must not include Drive transcript content or links');

const extraction = spawnSync(process.execPath, ['scripts/extract-course-assets.mjs', '--check'], { cwd: root, encoding: 'utf8' });
check(extraction.status === 0, `Generated files must be current. ${extraction.stdout}${extraction.stderr}`);

const bookCheck = spawnSync(process.execPath, ['scripts/book-materials-check.mjs'], { cwd: root, encoding: 'utf8' });
check(bookCheck.status === 0, `Imported textbook files must exist and match their declared formats. ${bookCheck.stdout}${bookCheck.stderr}`);
console.log(bookCheck.stdout.trim());
console.log(`Quality checks passed: ${checks} assertions across ${items.length} local examples and ${materials.length} material files.`);
console.log('Note: this validates currently available local lesson examples; it does not claim recovery of the historical 56-recording / 861-row archive.');
