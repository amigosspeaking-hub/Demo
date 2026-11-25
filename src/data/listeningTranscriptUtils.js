const SECTION_NUMBER = /^\d+[.)]?$/u;
const ACTIVITY_LABEL = /(?:\s+|^)ACTIVIDAD\s+\d+\.?\s*$/iu;
const SPEAKER_LABEL = /^(?:[A-Z]|Locutora|Ana|Víctor|Daniel|Estela)\s*:/u;
const ENUMERATED_START = /^(?:\d+|[a-j])\.\s+\S/u;

/** Convert imported transcript formatting into spoken turns / list items. */
export function transcriptSegments(text = '', file = '') {
  const lines = text.split(/\r?\n/u).map(line => line.trim().replace(ACTIVITY_LABEL, '').trim()).filter(Boolean);
  const phraseLists = new Set(['auint_plus_1_02.mp3', 'auint_plus_1_03.mp3', 'auint_plus_1_14.mp3', 'auint_plus_1_32.mp3']);
  if (phraseLists.has(file)) return lines.filter(line => !SECTION_NUMBER.test(line));
  if (file === 'auint_plus_1_20.mp3') {
    return [...text.matchAll(/(?:^|\s)([a-f])\.\s*([\s\S]*?)(?=(?:\s+[a-f]\.\s)|$)/gmu)].map(match => match[2].trim().replace(ACTIVITY_LABEL, '').trim()).filter(Boolean);
  }
  const segments = [];
  let afterSectionNumber = false;
  for (const line of lines) {
    if (SECTION_NUMBER.test(line)) { afterSectionNumber = true; continue; }
    const startsSegment = afterSectionNumber || SPEAKER_LABEL.test(line) || ENUMERATED_START.test(line);
    if (startsSegment || segments.length === 0) segments.push(line);
    else segments[segments.length - 1] += ` ${line}`;
    afterSectionNumber = false;
  }
  return segments;
}

export function isSpanishText(text = '') {
  return /[A-Za-zÀ-ÿ¿¡]/u.test(text);
}
