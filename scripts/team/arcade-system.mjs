#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lessonLibrary } from '../../src/data/lessons.js';
import { grammarGuides } from '../../src/data/grammar.js';
import { grammarDetails } from '../../src/data/grammarDetails.js';
import { lessonStories } from '../../src/data/stories.js';
import { lessonSentenceBanks } from '../../src/data/sentences.js';
import { courseBookMaterials } from '../../src/data/courseMaterials.js';
import bookActivities from '../../src/data/bookActivities.json' with { type: 'json' };
import { arcadeScoring, buildChoiceDeck } from '../../src/data/arcadeEngine.js';

let checks = 0;
const check = (condition, message) => { checks += 1; assert.ok(condition, message); };
const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const expectedGames = ['match', 'quiz', 'listen', 'storyListen', 'order'];
const expectedModes = ['practice', 'challenge', 'sprint'];
const gameCatalog = app.slice(app.indexOf('const gameCatalog = ['), app.indexOf('const arcadeModes = ['));
const modeCatalog = app.slice(app.indexOf('const arcadeModes = ['), app.indexOf('function currentLessons('));
const bankRouter = app.slice(app.indexOf('function arcadeBankFor('), app.indexOf('function arcadeRoundLimit('));
for (const id of expectedGames) {
  check(gameCatalog.includes(`id: '${id}'`), `Arcade game ${id} must remain registered`);
  check(bankRouter.includes(`gameId === '${id}'`), `Arcade game ${id} must resolve its own content bank`);
}
for (const id of expectedModes) check(modeCatalog.includes(`id: '${id}'`), `Arcade round mode ${id} must remain registered`);
check(modeCatalog.includes('timed: false') && modeCatalog.includes('seconds: 90') && modeCatalog.includes('seconds: 45') && modeCatalog.includes('multiplier: 2'), 'Practice, challenge, and sprint must retain distinct pacing and scoring settings');
check(app.includes("hola-arcade-records") && app.includes('finishReported.current') && app.includes('onFinish?.('), 'Arcade records must persist and a completed run must be reported once');
check(Object.keys(arcadeScoring).sort().join(',') === [...expectedGames].sort().join(','), 'Every game must own a specific scoring rule');
check(new Set(Object.values(arcadeScoring).map(rule => rule.base)).size === expectedGames.length && app.includes('const scoring = arcadeScoring[game.id]'), 'Game scoring must differ and the active game must apply its own rule');
check(app.includes('buildChoiceDeck(roundBank.filter') && app.includes('موضع الإجابة الصحيحة بيتغيّر'), 'Choice games must use the randomized answer-position deck');
check(app.includes('onEnded={() => setAudioPlayed(true)}') && app.includes('!audioPlayed'), 'Listening questions must require audio playback before enabling choices');
check(app.includes('const translations = [') && app.includes('const questions = [') && app.includes('return questions.map(item =>') && app.includes('translations.filter(value => value !== item.correct)'), 'Each lesson quiz must construct distractors within its own lesson-bank scope');
const syntheticQuestions = Array.from({ length: 20 }, (_, index) => ({ correct: `صح ${index}`, options: [`صح ${index}`, 'خيار أ', 'خيار ب', 'خيار ج'] }));
const answerDeck = buildChoiceDeck(syntheticQuestions);
const answerSlots = answerDeck.map((choices, index) => {
  check(choices.length === 4 && new Set(choices).size === 4, `Randomized choice ${index + 1} must contain four distinct options`);
  check(choices.filter(option => option === syntheticQuestions[index].correct).length === 1, `Randomized choice ${index + 1} must include the correct answer exactly once`);
  return choices.indexOf(syntheticQuestions[index].correct);
});
check(answerSlots.every((slot, index) => index === 0 || slot !== answerSlots[index - 1]), 'Correct answer positions must never repeat on adjacent questions');
for (let index = 0; index < answerSlots.length; index += 4) {
  check(new Set(answerSlots.slice(index, index + 4)).size === 4, `Questions ${index + 1}-${index + 4} must balance correct answers across A/B/C/D`);
}

let totals = { pairs: 0, quiz: 0, story: 0, order: 0, originalListening: 0 };
for (const [id, lesson] of Object.entries(lessonLibrary)) {
  const story = lessonStories[id]?.sentences || [];
  const candidates = [
    ...lesson.words,
    ...(grammarDetails[id] || []).map(topic => ({ es: topic.es, ar: topic.ar })),
    ...(grammarGuides[id]?.examples || []).map(([es, ar]) => ({ es, ar })),
  ];
  const seenEs = new Set();
  const seenAr = new Set();
  const pairs = candidates.filter(pair => {
    if (!pair.es || !pair.ar || seenEs.has(pair.es) || seenAr.has(pair.ar)) return false;
    seenEs.add(pair.es); seenAr.add(pair.ar); return true;
  });
  check(pairs.length >= 7, `${id}: matching game needs at least seven unique, one-to-one lesson pairs`);
  totals.pairs += pairs.length;

  const translations = [
    ...lesson.words.map(word => word.ar), ...(lesson.answers || []),
    ...(grammarGuides[id]?.examples || []).map(([, ar]) => ar), ...story.map(sentence => sentence.ar),
  ];
  const quizQuestions = [
    ...lesson.words.map(word => word.ar), lesson.answers?.[0],
    ...(grammarGuides[id]?.examples || []).map(([, ar]) => ar), ...story.map(sentence => sentence.ar),
  ].filter(Boolean);
  check(quizQuestions.length >= 10, `${id}: quiz bank needs ten or more varied lesson questions`);
  for (const correct of quizQuestions) {
    const options = [...new Set([correct, ...translations.filter(value => value !== correct)])].slice(0, 4);
    check(options[0] === correct && options.length === 4, `${id}: each quiz question needs the correct answer and three distinct lesson-level distractors`);
  }
  totals.quiz += quizQuestions.length;

  check(story.length >= 5 && story.every(sentence => sentence.es?.trim() && sentence.ar?.trim()), `${id}: story listening requires a complete paired bilingual bank`);
  for (const sentence of story) {
    const options = [...new Set([sentence.ar, ...story.filter(item => item.ar !== sentence.ar).map(item => item.ar), ...lesson.words.map(word => word.ar)])];
    check(options.length >= 4, `${id}: every story listening prompt needs four distinct answer choices`);
  }
  totals.story += story.length;

  const order = [...new Set([lesson.example, ...(lessonSentenceBanks[id] || []), ...story.map(sentence => sentence.es)].map(text => text?.trim()).filter(Boolean))];
  check(order.length >= 8, `${id}: sentence building needs at least eight distinct lesson/story phrases`);
  check(order.every(text => text.split(/\s+/u).length >= 4), `${id}: sentence-building prompts must be long enough to make ordering meaningful`);
  totals.order += order.length;

  if (id.startsWith('A1-')) {
    const unitIndex = Number(id.split('-')[1]);
    const course = unitIndex <= 3 ? 'A1.1' : unitIndex <= 6 ? 'A1.2' : 'A1.3';
    const unit = `u${unitIndex}`;
    const listeningQuestions = (bookActivities.stages?.[course]?.listen?.bank || []).filter(item => item.tunit === unit);
    check(listeningQuestions.length > 0, `${id}: original listening game must have source-book questions and must not fabricate them`);
    check(listeningQuestions.every(item => item.opts?.length === 4 && new Set(item.opts).size === 4 && item.opts[item.a]), `${id}: original listening choices must have four distinct options and a valid source answer`);
    check((courseBookMaterials[id]?.tracks || []).length > 0, `${id}: original listening question must have a mapped local audio track`);
    totals.originalListening += listeningQuestions.length;
  }
}

console.log(`Arcade engine passed: ${checks} checks across ${Object.keys(lessonLibrary).length} lessons.`);
console.log(`Validated banks: ${totals.pairs} match pairs · ${totals.quiz} quiz prompts · ${totals.story} story-listen prompts · ${totals.order} sentence-order prompts · ${totals.originalListening} original A1 listening questions.`);
console.log('A2 book audio/pages are not mislabeled as imported exercise banks; original-listening game remains limited to source-verified A1 questions.');
