#!/usr/bin/env node
import assert from 'node:assert/strict';
import { open, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseBookMaterials } from '../src/data/courseMaterials.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expected = {
  'A1.1': ['A1-0', 'A1-1', 'A1-2', 'A1-3'],
  'A1.2': ['A1-4', 'A1-5', 'A1-6'],
  'A1.3': ['A1-7', 'A1-8', 'A1-9'],
  'A2.1': ['A2-1', 'A2-2', 'A2-3', 'A2-4'],
  'A2.2': ['A2-5', 'A2-6', 'A2-7', 'A2-8'],
  'A2.3': ['A2-9', 'A2-10'],
};
const expectedCourseRanges = {
  'A1.1': [0, 3], 'A1.2': [4, 6], 'A1.3': [7, 9],
  'A2.1': [1, 4], 'A2.2': [5, 8], 'A2.3': [9, 10],
};
const expectedPageRanges = {
  'A1-0': [10, 13], 'A1-1': [14, 27], 'A1-2': [28, 41], 'A1-3': [42, 55],
  'A1-4': [56, 69], 'A1-5': [70, 83], 'A1-6': [84, 97],
  'A1-7': [98, 111], 'A1-8': [112, 125], 'A1-9': [126, 139],
  'A2-1': [10, 23], 'A2-2': [24, 37], 'A2-3': [38, 51], 'A2-4': [52, 65],
  'A2-5': [66, 79], 'A2-6': [80, 93], 'A2-7': [94, 107], 'A2-8': [108, 121],
  'A2-9': [122, 135], 'A2-10': [136, 149],
};
const expectedA2AudioPages = {
  'A2-1': { '01': 11, '02': 12, '03': 17, '04': 17, '05': 20 },
  'A2-2': { '06': 27, '07': 36 },
  'A2-3': { '08': 41, '09': 42 },
  'A2-4': { '10': 55, '11': 57, '12': 62, '13': 62, '14': 62, '15': 62 },
};
let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}
const seenPages = new Set();
const seenAudio = new Set();
let pageCount = 0;
let audioCount = 0;
for (const [stage, lessonIds] of Object.entries(expected)) {
  const [firstIndex, lastIndex] = expectedCourseRanges[stage];
  const prefix = stage.startsWith('A1') ? 'A1-' : 'A2-';
  const actualIds = Object.keys(courseBookMaterials).filter(id => id.startsWith(prefix) && Number(id.split('-')[1]) >= firstIndex && Number(id.split('-')[1]) <= lastIndex);
  check(JSON.stringify(actualIds) === JSON.stringify(lessonIds), `${stage}: book resources must follow the selected course map`);
  for (const lessonId of lessonIds) {
    const lesson = courseBookMaterials[lessonId];
    check(Boolean(lesson?.title && lesson?.unit && lesson?.book), `${lessonId}: source unit metadata must exist`);
    check(lesson.pages.length > 0, `${lessonId}: original book page scans must exist`);
    check(lesson.tracks.length > 0, `${lessonId}: original course audio must exist`);
    check(new Set(lesson.pages.map(page => page.page)).size === lesson.pages.length, `${lessonId}: page numbers must be unique within the lesson map`);
    const [coreStart, coreEnd] = expectedPageRanges[lessonId];
    const corePages = lesson.pages.slice(0, coreEnd - coreStart + 1).map(page => page.page);
    check(corePages[0] === coreStart && corePages.at(-1) === coreEnd, `${lessonId}: core page range must match the source unit`);
    check(corePages.every((page, index) => index === 0 || page === corePages[index - 1] + 1), `${lessonId}: core textbook pages must remain sequential`);
    for (const page of lesson.pages) {
      const relative = `public${page.src}`;
      check(relative.startsWith(`public/materials/books/${stage}/pages/`) && relative.endsWith('.webp'), `${lessonId}: page must be an optimized, local image`);
      seenPages.add(relative);
      const file = path.join(root, relative);
      const info = await stat(file);
      check(info.size > 1000, `${relative}: page image must not be empty`);
      const handle = await open(file, 'r');
      const header = Buffer.alloc(12);
      try { await handle.read(header, 0, 12, 0); } finally { await handle.close(); }
      check(header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP', `${relative}: page asset must be a valid WebP image`);
    }
    for (const track of lesson.tracks) {
      const relative = `public${track.src}`;
      check(relative.startsWith(`public/materials/books/${stage}/audio/`) && relative.endsWith('.mp3'), `${lessonId}: audio must be a local MP3`);
      check(!seenAudio.has(relative), `${relative}: audio asset must not be duplicated`); seenAudio.add(relative);
      const file = path.join(root, relative);
      const info = await stat(file);
      check(info.size > 10_000, `${relative}: audio asset must not be empty`);
      const handle = await open(file, 'r');
      const header = Buffer.alloc(3);
      try { await handle.read(header, 0, 3, 0); } finally { await handle.close(); }
      check(header.toString('ascii') === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0), `${relative}: audio must have a valid MP3 header`);
      check(Boolean(track.id && track.title && track.variant), `${relative}: original track metadata must be available`);
      if (Number(lessonId.split('-')[1]) >= 5) check(lesson.pages.some(page => page.page === track.page), `${relative}: linked textbook page must be included in the lesson materials`);
      if (expectedA2AudioPages[lessonId]) check(track.page === expectedA2AudioPages[lessonId][track.id], `${relative}: audio must open on its actual source page`);
      audioCount += 1;
    }
  }
}
pageCount = seenPages.size;
check(pageCount === 362, `Expected the 362 unique mapped textbook scans; found ${pageCount}`);
check(audioCount === 120, `Expected 120 selected original audio tracks including alternates; found ${audioCount}`);
console.log(`Course book assets passed: ${checks} checks; ${pageCount} unique scans and ${audioCount} lesson audio tracks across A1.1–A1.3 and A2.1–A2.3.`);
