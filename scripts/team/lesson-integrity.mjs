#!/usr/bin/env node
import assert from 'node:assert/strict';
import { lessonLibrary } from '../../src/data/lessons.js';
import { courseBookMaterials } from '../../src/data/courseMaterials.js';

let checks = 0;
const check = (condition, message) => { checks += 1; assert.ok(condition, message); };
const report = { A1: 0, A2: 0, B1: 0, B2: 0 };

for (const [id, lesson] of Object.entries(lessonLibrary)) {
  const level = id.match(/^B?[A-C][12]/)?.[0] || id.split('-')[0];
  if (level in report) report[level] += 1;
  check(Boolean(lesson.heading?.trim()), `${id}: missing lesson heading`);
  check(Boolean(lesson.objective?.trim()), `${id}: missing lesson objective`);
  check(Array.isArray(lesson.words) && lesson.words.length > 0, `${id}: vocabulary bank must not be empty`);
  check(Boolean(lesson.example?.trim() && lesson.translation?.trim()), `${id}: Spanish example and Arabic translation are both required`);
  check(Boolean(lesson.question?.trim()) && Array.isArray(lesson.answers) && lesson.answers.length >= 2, `${id}: lesson review question and answer choices are required`);
  check(/[\u0600-\u06ff]/u.test(lesson.translation), `${id}: example translation must contain Arabic`);
  check(/\p{Script=Latin}/u.test(lesson.example), `${id}: Spanish example must contain Latin text`);
  for (const [wordIndex, word] of lesson.words.entries()) {
    check(Boolean(word.es?.trim()), `${id} word ${wordIndex + 1}: missing Spanish text`);
    check(Boolean(word.ar?.trim()), `${id} word ${wordIndex + 1}: missing Arabic meaning`);
    check(Boolean(word.say?.trim()), `${id} word ${wordIndex + 1}: missing pronunciation hint`);
    check(/[\u0600-\u06ff]/u.test(word.ar), `${id} word ${wordIndex + 1}: Arabic meaning lacks Arabic script`);
    check(/\p{Script=Latin}/u.test(word.es), `${id} word ${wordIndex + 1}: Spanish text lacks Latin script`);
  }
  const material = courseBookMaterials[id];
  if (material) {
    check(Array.isArray(material.pages) && material.pages.length > 0, `${id}: mapped book unit has no pages`);
    check(Array.isArray(material.tracks) && material.tracks.length > 0, `${id}: mapped book unit has no audio`);
  }
}

console.log(`Lesson integrity passed: ${checks} checks across ${Object.keys(lessonLibrary).length} locally defined units.`);
console.log(`Current locally defined units: ${Object.entries(report).map(([level, count]) => `${level}=${count}`).join(' · ')}`);
