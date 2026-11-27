#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonLibrary } from '../../src/data/lessons.js';
import { courseBookMaterials } from '../../src/data/courseMaterials.js';
import bookActivities from '../../src/data/bookActivities.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bookRoot = path.join(root, 'public/materials/books');
const readerRoot = path.join(root, 'public/materials/readers');
const directories = async (folder) => {
  try { return (await readdir(folder, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name); }
  catch { return []; }
};
const bookDirs = await directories(bookRoot);
const readerDirs = await directories(readerRoot);
const levelPrefixes = ['A1', 'A2', 'B1', 'B2'];
const rows = [];

for (const level of levelPrefixes) {
  const lessons = Object.keys(lessonLibrary).filter(id => id.startsWith(`${level}-`));
  const mapped = lessons.filter(id => Boolean(courseBookMaterials[id]));
  const pageCount = lessons.reduce((sum, id) => sum + (courseBookMaterials[id]?.pages?.length || 0), 0);
  const audioCount = lessons.reduce((sum, id) => sum + (courseBookMaterials[id]?.tracks?.length || 0), 0);
  const books = bookDirs.filter(name => name.startsWith(`${level}.`));
  const readers = readerDirs.filter(name => name.startsWith(`${level}.`));
  const activityStages = Object.keys(bookActivities.stages || {}).filter(name => name.startsWith(`${level}.`));
  const gaps = [];
  if (lessons.length === 0) gaps.push('لا توجد وحدات دراسية في lessonLibrary');
  if (mapped.length < lessons.length) gaps.push(`${lessons.length - mapped.length} وحدة بلا ربط بمواد الكتاب`);
  if (books.length === 0) gaps.push('لا توجد مجلدات صفحات/صوتيات للكتاب');
  rows.push({ level, lessons: lessons.length, mapped: mapped.length, pages: pageCount, tracks: audioCount, books: books.length, readers: readers.length, activityStages: activityStages.length, gaps });
}

console.log('Course coverage audit — الموجود محليًا فقط، دون افتراض محتوى غير مستورد');
console.log('CEFR | وحدات | ربط كتاب | صفحات | تسجيلات | مجلدات كتاب | قارئ | بنوك أنشطة');
for (const row of rows) {
  console.log(`${row.level.padEnd(4)} | ${String(row.lessons).padStart(5)} | ${String(row.mapped).padStart(8)} | ${String(row.pages).padStart(5)} | ${String(row.tracks).padStart(8)} | ${String(row.books).padStart(11)} | ${String(row.readers).padStart(4)} | ${String(row.activityStages).padStart(10)}`);
  if (row.gaps.length) console.log(`  BLOCKER ${row.level}: ${row.gaps.join('؛ ')}`);
}

const unlinked = Object.keys(lessonLibrary).filter(id => !courseBookMaterials[id]);
if (unlinked.length) console.log(`تنبيه: وحدات بلا خرائط كتاب: ${unlinked.join(', ')}`);
console.log('ملاحظة: وجود صفحات أو تسجيلات لا يعني أن بنك الأنشطة الرقمية مكتمل.');
