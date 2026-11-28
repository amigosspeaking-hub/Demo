function normalizeSpanishPhrase(value) {
  return String(value || '')
    .toLocaleLowerCase('es')
    .replace(/[¿?¡!….,;:()[\]{}"“”‘’«»]/gu, ' ')
    .replace(/[–—-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function spanishPhraseOccurs(sentence, phrase) {
  const normalizedSentence = normalizeSpanishPhrase(sentence);
  const normalizedPhrase = normalizeSpanishPhrase(phrase);
  if (!normalizedSentence || !normalizedPhrase) return false;
  if (phrase.includes('¿')) {
    const openingQuestionMark = sentence.indexOf('¿');
    const closingQuestionMark = sentence.indexOf('?', openingQuestionMark + 1);
    if (openingQuestionMark < 0 || closingQuestionMark < 0) return false;
  }
  return (` ${normalizedSentence} `).includes(` ${normalizedPhrase} `);
}

export function buildVocabularyExamples(lesson, grammarGuide, story, sentenceBank = []) {
  const examples = [];
  if (lesson?.example && lesson?.translation) {
    examples.push({ es: lesson.example, ar: lesson.translation, source: 'lesson' });
  }
  for (const [es, ar] of grammarGuide?.examples || []) {
    if (es && ar) examples.push({ es, ar, source: 'grammar' });
  }
  for (const sentence of story?.sentences || []) {
    if (sentence.es && sentence.ar) examples.push({ es: sentence.es, ar: sentence.ar, source: 'story' });
  }
  for (const sentence of sentenceBank || []) {
    if (sentence) examples.push({ es: sentence, ar: '', source: 'sentence-bank' });
  }
  return examples;
}

export function findRelatedVocabularyExample(word, examples) {
  if (!word?.es) return null;
  return examples.find(example => spanishPhraseOccurs(example.es, word.es)) || null;
}
