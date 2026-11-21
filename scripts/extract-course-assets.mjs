#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonLibrary } from '../src/data/lessons.js';
import { buildListeningItems } from '../src/data/listening.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const allItems = buildListeningItems(lessonLibrary);

// These boundaries mirror the local course map documented in README.md.
// No Drive transcript, external URL, or generated translation is used.
const materials = [
  { id: 'A1.1', itemIds: ['A1-0', 'A1-1', 'A1-2', 'A1-3'] },
  { id: 'A1.2', itemIds: ['A1-4', 'A1-5', 'A1-6'] },
  { id: 'A1.3', itemIds: ['A1-7', 'A1-8', 'A1-9'] },
  { id: 'A2.1', itemIds: ['A2-1', 'A2-2', 'A2-3', 'A2-4'] },
  { id: 'A2.2', itemIds: ['A2-5', 'A2-6', 'A2-7', 'A2-8'] },
  { id: 'A2.3', itemIds: ['A2-9', 'A2-10'] },
];

const outputs = new Map();
outputs.set('scripts/listening-translations.json', {
  schemaVersion: 1,
  source: 'src/data/lessons.js',
  sourceType: 'local lesson examples; speech is synthesized by the browser',
  note: 'These are the locally available sentence examples, not a recovered recording transcript archive.',
  itemCount: allItems.length,
  items: allItems.map((item) => ({
    id: item.id,
    level: item.level,
    title: item.title,
    spanish: item.spanish,
    arabic: item.arabic,
  })),
});

for (const material of materials) {
  const selected = material.itemIds.map((id) => allItems.find((item) => item.id === id));
  if (selected.some((item) => !item)) {
    throw new Error(`Missing local lesson(s) required for ${material.id}`);
  }
  outputs.set(`public/materials/${material.id}/activity-data.json`, {
    schemaVersion: 1,
    material: material.id,
    source: 'src/data/lessons.js',
    itemCount: selected.length,
    activities: selected.map((item) => ({
      id: item.id,
      title: item.title,
      level: item.level,
      exampleSpanish: item.spanish,
      translationArabic: item.arabic,
      words: lessonLibrary[item.id].words,
    })),
  });
}

let stale = false;
for (const [relativePath, data] of outputs) {
  const destination = path.join(root, relativePath);
  const contents = `${JSON.stringify(data, null, 2)}\n`;
  if (checkOnly) {
    let current = '';
    try { current = await readFile(destination, 'utf8'); } catch { /* report missing output below */ }
    if (current !== contents) {
      console.error(`STALE: ${relativePath}`);
      stale = true;
    }
  } else {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, contents, 'utf8');
    console.log(`Wrote ${relativePath} (${data.itemCount} item(s))`);
  }
}

if (checkOnly && stale) process.exitCode = 1;
if (checkOnly && !stale) console.log(`Course assets are current (${outputs.size} files).`);
