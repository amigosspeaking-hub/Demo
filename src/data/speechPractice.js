const WORD_PATTERN = /[\p{Script=Latin}\p{M}\p{N}]+(?:['’][\p{Script=Latin}\p{M}\p{N}]+)*/gu;

function rawSpanishWords(text = '') {
  return String(text).match(WORD_PATTERN) || [];
}
function normalizeWord(word) {
  return word.normalize('NFD').replace(/[\u0300-\u0302\u0304-\u036f]/gu, '').toLowerCase();
}
export function spanishSpeechWords(text = '') {
  return rawSpanishWords(text).map(normalizeWord);
}

export function compareSpanishReading(expectedText = '', spokenText = '') {
  const expectedDisplay = rawSpanishWords(expectedText);
  const spokenDisplay = rawSpanishWords(spokenText);
  const expected = expectedDisplay.map(normalizeWord);
  const spoken = spokenDisplay.map(normalizeWord);
  const rows = expected.length + 1;
  const columns = spoken.length + 1;
  const distance = Array.from({ length: rows }, () => Array(columns).fill(0));

  for (let i = 0; i < rows; i += 1) distance[i][0] = i;
  for (let j = 0; j < columns; j += 1) distance[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      const substitutionCost = expected[i - 1] === spoken[j - 1] ? 0 : 1;
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + substitutionCost,
      );
    }
  }

  const aligned = [];
  let i = expected.length;
  let j = spoken.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expected[i - 1] === spoken[j - 1] && distance[i][j] === distance[i - 1][j - 1]) {
      aligned.push({ type: 'correct', expected: expectedDisplay[i - 1], heard: spokenDisplay[j - 1] });
      i -= 1; j -= 1;
    } else if (i > 0 && j > 0 && distance[i][j] === distance[i - 1][j - 1] + 1) {
      aligned.push({ type: 'wrong', expected: expectedDisplay[i - 1], heard: spokenDisplay[j - 1] });
      i -= 1; j -= 1;
    } else if (i > 0 && distance[i][j] === distance[i - 1][j] + 1) {
      aligned.push({ type: 'missing', expected: expectedDisplay[i - 1], heard: '' });
      i -= 1;
    } else {
      aligned.push({ type: 'extra', expected: '', heard: spokenDisplay[j - 1] });
      j -= 1;
    }
  }
  aligned.reverse();

  const matched = aligned.filter(word => word.type === 'correct').length;
  const accuracy = expected.length ? Math.round(matched / expected.length * 100) : 0;
  const exact = expected.length > 0 && matched === expected.length && aligned.every(word => word.type === 'correct');
  return {
    expectedCount: expected.length,
    spokenCount: spoken.length,
    matchedCount: matched,
    accuracy,
    exact,
    verdict: exact ? 'excellent' : accuracy >= 80 ? 'close' : 'retry',
    words: aligned,
  };
}
