#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { lessonLibrary } from '../src/data/lessons.js';
import { courseBookMaterials } from '../src/data/courseMaterials.js';
import { buildListeningItems, transcriptText } from '../src/data/listening.js';

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
check(appSource.includes('data-testid="bilingual-transcript"'), 'Listening UI must expose a stable bilingual transcript test hook');
check(appSource.includes("showArabic ? '' : 'arabic-hidden'"), 'Listening UI must collapse to one column when Arabic is hidden');
const styleSource = await readFile(path.join(root, 'src/styles.css'), 'utf8');
check(styleSource.includes('.bilingual-transcript{direction:ltr}') && styleSource.includes('.story-bilingual,.grammar-example-row,.live-match-grid{direction:ltr}'), 'Mixed-script sentence layouts must place Spanish content from left to right');
check(appSource.includes('onClick={() => onSaveWord(current.es)}'), 'Saving a lesson word must update the shared vocabulary list');
check(appSource.includes('{selected?.spanish}') && appSource.includes('{selected?.arabic}'), 'Listening UI must render each Spanish sentence alongside its Arabic translation');
check(appSource.includes('setShowArabic(value => !value)'), 'Listening UI must let learners show or hide Arabic translations');
check(appSource.includes('setRate(value)'), 'Listening UI must expose selectable speech rates');
check(appSource.includes('buildListeningItems(lessonLibrary).filter(item => lessonIds.has(item.id))'), 'Listening UI must present bilingual lesson sentences, not isolated vocabulary pairs');
check(appSource.includes('const questions = useMemo(() => questionPool(stage, lesson.id), [stage, lesson.id])'), 'Game question order must stay stable while a learner answers');
check(appSource.includes('const pool = useMemo(() => questionPool(stage, lessonId === \'all\' ? null : lessonId), [stage, lessonId])'), 'Quiz options must stay stable while a learner answers');
check(appSource.includes('onClick={() => restart()}'), 'Restart button must restart with the currently selected scope');
check(!appSource.includes('window.location.reload()'), 'Game flow must return to the arcade without reloading the entire app');
check(appSource.includes('window.SpeechRecognition || window.webkitSpeechRecognition'), 'Speaking UI must use the browser microphone recognition API');
check(appSource.includes('const gameCatalog = [') && appSource.includes('function GameRun('), 'Arcade must offer separate playable game modes');
const homeSource = appSource.slice(appSource.indexOf('function HomePage('), appSource.indexOf('function PathPage('));
check(homeSource.includes('find(lesson => !completedLessons.includes(lesson.id))'), 'Home primary action must continue the next unfinished lesson in the selected stage');
check(homeSource.includes('courseBookMaterials[nextLesson?.id]?.pages?.[0]'), 'Home feature area must use a real local textbook scan');
check(homeSource.includes('home-lesson-list') && homeSource.includes('completedCount} من {courseLessons.length}'), 'Home must show the selected stage lessons and a compact, accurate progress summary');
check(!homeSource.includes('daily-card') && !homeSource.includes('word-feature') && !homeSource.includes('grammar-card'), 'Home must not duplicate the challenge, word-of-day, and grammar panels');
check(appSource.includes('function LessonCard(') && appSource.includes('lesson-card-cover') && appSource.includes('material?.tracks?.length'), 'Lesson cards must include book previews and locally mapped audio metadata');
check(appSource.includes('const mobileNavItems = [') && appSource.includes("{ id: 'games', label: 'الألعاب'"), 'Mobile navigation must keep a small set of primary destinations');
check(appSource.includes('<span>المزيد</span>') && appSource.includes('aria-expanded={mobileMenuOpen}'), 'Secondary sections must remain accessible through the expandable More menu');
check(!homeSource.includes('addXp(') && !homeSource.includes('gracias'), 'Home must not award repeatable XP or show unrelated fixed-level content');
check(appSource.includes('selectedStage, displayName') && appSource.includes("useState(initial.selectedStage || 'A1.1')"), 'Profile stage selection must persist locally');
check(!/drive\.google\.com/i.test(appSource), 'Learner-facing pages must not send students to Google Drive');
check(appSource.includes('function BookLessonMaterials(') && appSource.includes('<BookLessonMaterials lessonId={lessonId}/>'), 'Each mapped lesson must open its own original book pages and audio in-app');
check(appSource.includes('<BookListeningLibrary stage={stage}/>'), 'Listening page must expose only original audio mapped to the selected course stage');
check(appSource.includes('onClick={() => changeRate(value)}') && appSource.includes('Versión alternativa'), 'Original audio player must provide speed choices and explicit alternate-track labels');
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
check(appSource.includes('function originalReaderForLesson(') && appSource.includes('/materials/readers/${course}/index.html#p${firstPage}'), 'Each supported lesson must open its own book reader at the matching page inside the app');
check(appSource.includes("index >= 5 && index <= 8 ? 'A2.2'") && appSource.includes("index >= 9 && index <= 10 ? 'A2.3'"), 'A2 lessons 5–10 must open the restored A2.2 and A2.3 in-app readers');

const grammarGuides = await import('../src/data/grammar.js');
const lessonStories = await import('../src/data/stories.js');
const sentenceBanks = await import('../src/data/sentences.js');
for (const lessonId of Object.keys(lessonLibrary)) {
  check(Boolean(grammarGuides.grammarGuides[lessonId]?.explanation), `${lessonId}: detailed grammar guide must exist`);
  check(Boolean(lessonStories.lessonStories[lessonId]?.es && lessonStories.lessonStories[lessonId]?.ar), `${lessonId}: bilingual speaking story must exist`);
  check(sentenceBanks.lessonSentenceBanks[lessonId]?.length >= 3, `${lessonId}: independent sentence game bank must contain multiple prompts`);
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
