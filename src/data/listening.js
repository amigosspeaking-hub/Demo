import { lessonLibrary } from './lessons.js';

const levelFor = (id) => (id.startsWith('A1-') ? 'A1' : 'A2');

function cleanHeading(heading = '') {
  return heading.replace(/^A\d(?:\.\d)?\s*[·—-]\s*/u, '').trim();
}

/** Build listening/translation cards only from the lesson content checked into this project. */
export function buildListeningItems(lessons = lessonLibrary) {
  return Object.entries(lessons)
    .filter(([, lesson]) => typeof lesson.example === 'string' && typeof lesson.translation === 'string')
    .map(([id, lesson]) => ({
      id,
      level: levelFor(id),
      title: cleanHeading(lesson.heading),
      spanish: lesson.example.trim(),
      arabic: lesson.translation.trim(),
    }));
}

/** Return the complete transcript for the selected tab; never add unit/activity labels. */
export function transcriptText(item, language) {
  if (language === 'ar') return item.arabic;
  if (language === 'es') return item.spanish;
  throw new Error(`Unsupported transcript language: ${language}`);
}

export const listeningItems = buildListeningItems();
