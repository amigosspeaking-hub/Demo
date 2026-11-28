#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lessonLibrary } from '../../src/data/lessons.js';
import { grammarGuides } from '../../src/data/grammar.js';
import { lessonStories } from '../../src/data/stories.js';
import { lessonSentenceBanks } from '../../src/data/sentences.js';
import { buildVocabularyExamples, findRelatedVocabularyExample, spanishPhraseOccurs } from '../../src/data/vocabularyUtils.js';

let total = 0;
let previouslyUnrelated = 0;
let matchedExamples = 0;
let cardsWithoutExamples = 0;
for (const [lessonId, lesson] of Object.entries(lessonLibrary)) {
  const sources = buildVocabularyExamples(lesson, grammarGuides[lessonId], lessonStories[lessonId], lessonSentenceBanks[lessonId]);
  for (const word of lesson.words) {
    total += 1;
    assert.ok(word.es?.trim() && word.ar?.trim() && word.say?.trim(), `${lessonId}: preserve all original vocabulary fields`);
    if (!spanishPhraseOccurs(lesson.example, word.es)) previouslyUnrelated += 1;
    const example = findRelatedVocabularyExample(word, sources);
    assert.ok(!example || spanishPhraseOccurs(example.es, word.es), `${lessonId} / ${word.es}: shown example must contain the complete vocabulary phrase`);
    if (example) matchedExamples += 1;
    else cardsWithoutExamples += 1;
  }
}
const screenshotLesson = lessonLibrary['A1-2'];
const porque = screenshotLesson.words.find(word => word.es === 'porque');
const screenshotSources = buildVocabularyExamples(screenshotLesson, grammarGuides['A1-2'], lessonStories['A1-2'], lessonSentenceBanks['A1-2']);
assert.equal(findRelatedVocabularyExample(porque, screenshotSources), null, 'Do not show “Quiero aprender español para viajar” under “porque”');
assert.ok(spanishPhraseOccurs(screenshotLesson.example, screenshotLesson.words[0].es), 'Keep that sentence as the relevant example for “Quiero aprender”');
assert.ok(!spanishPhraseOccurs('Hay una farmacia en mi barrio.', '¿Hay una farmacia?'), 'A statement must not be presented as an example of the question form');
assert.ok(!spanishPhraseOccurs('?¿Hay una farmacia', '¿Hay una farmacia?'), 'A reversed punctuation sequence must not be presented as correct Spanish');
const app = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8');
assert.ok(app.includes('findRelatedVocabularyExample(word, examples)'), 'WordsPage must use the verified vocabulary-example resolver');
assert.ok(app.includes('className="vocab-grid"') && app.includes('vocab-card${isSaved ?'), 'WordsPage must render the new card-grid system');
assert.ok(!app.slice(app.indexOf('function WordsPage('), app.indexOf('function ProgressPage(')).includes('word.say'), 'The WordsPage must not render the removed pronunciation fallback');
assert.ok(app.includes('word.example} ${word.exampleArabic}'), 'Search must include only the matched bilingual context, not the lesson-wide example');
assert.equal(total, 60, `Expected 60 locally defined A1/A2 vocabulary entries; got ${total}`);
assert.equal(matchedExamples, 43, `Expected 43 source-backed relevant examples; got ${matchedExamples}`);
assert.equal(cardsWithoutExamples, 17, `Expected 17 entries with no source-matched example; got ${cardsWithoutExamples}`);
assert.equal(previouslyUnrelated, 42, `The audit fixture should identify the 42 misleading lesson-example assignments; got ${previouslyUnrelated}`);
console.log(`Vocabulary audit passed: ${total} A1/A2 entries · ${previouslyUnrelated} previously showed an unrelated lesson example · now ${matchedExamples} use an exact sourced context and ${cardsWithoutExamples} omit the example row entirely.`);
console.log('The “porque” card no longer borrows “para viajar”; its lesson sentence remains attached to “Quiero aprender”.');
