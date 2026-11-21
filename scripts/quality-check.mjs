#!/usr/bin/env node
import assert from 'node:assert/strict';
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
check(homeSource.includes('const featuredLesson = courseLessons[0]'), 'Home challenge must use the selected stage content');
check(!homeSource.includes('addXp(') && !homeSource.includes('gracias'), 'Home quick challenge must not award repeatable XP or show unrelated fixed-level content');
check(appSource.includes('selectedStage, displayName') && appSource.includes("useState(initial.selectedStage || 'A1.1')"), 'Profile stage selection must persist locally');
check(!/drive\.google\.com/i.test(appSource), 'Learner-facing pages must not send students to Google Drive');
check(appSource.includes('function BookLessonMaterials(') && appSource.includes('<BookLessonMaterials lessonId={lessonId}/>'), 'Each mapped lesson must open its own original book pages and audio in-app');
check(appSource.includes('<BookListeningLibrary stage={stage}/>'), 'Listening page must expose only original audio mapped to the selected course stage');
check(appSource.includes('onClick={() => changeRate(value)}') && appSource.includes('Versión alternativa'), 'Original audio player must provide speed choices and explicit alternate-track labels');
check(!/window\.open\(|target=["']_blank/i.test(appSource), 'Course material playback must stay inside the application');
check(Object.keys(courseBookMaterials).length === 14, 'Imported book resources must map the 14 supported A1 and A2.1 lessons');
check(courseBookMaterials['A1-0']?.pages[0]?.page === 10 && courseBookMaterials['A1-9']?.pages.at(-1)?.page === 139, 'A1 page ranges must follow the actual three archived course units');
check(courseBookMaterials['A2-1']?.pages[0]?.page === 10 && courseBookMaterials['A2-4']?.pages.at(-1)?.page === 65, 'A2.1 pages must follow the four units actually present in its ready-to-website archive');

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
