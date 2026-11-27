export const arcadeScoring = {
  match: { base: 12, streakEvery: 4, streakBonus: 6, label: '١٢ نقطة لكل زوج · مكافأة عند ٤ أزواج متتالية' },
  quiz: { base: 10, streakEvery: 3, streakBonus: 5, label: '١٠ نقاط لكل إجابة · مكافأة كل ٣ إجابات متتالية' },
  listen: { base: 14, streakEvery: 2, streakBonus: 7, label: '١٤ نقطة لكل إجابة · مكافأة كل إجابتين متتاليتين' },
  storyListen: { base: 11, streakEvery: 3, streakBonus: 6, label: '١١ نقطة لكل جملة · مكافأة كل ٣ جمل متتالية' },
  order: { base: 15, streakEvery: 2, streakBonus: 8, label: '١٥ نقطة لكل جملة · مكافأة كل جملتين متتاليتين' },
};

function randomIndex(length, random) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function shuffled(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1, random);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

// Vary the correct answer position, guarantee no adjacent questions share it,
// and balance A/B/C/D within each block of four questions.
export function buildChoiceDeck(questions, random = Math.random) {
  let slotBlock = [];
  let previousSlot = -1;

  return questions.map(question => {
    if (!slotBlock.length) {
      slotBlock = shuffled([0, 1, 2, 3], random);
      if (slotBlock[0] === previousSlot) {
        const swapIndex = 1 + randomIndex(slotBlock.length - 1, random);
        [slotBlock[0], slotBlock[swapIndex]] = [slotBlock[swapIndex], slotBlock[0]];
      }
    }

    const correctSlot = slotBlock.shift();
    previousSlot = correctSlot;
    const distractors = [...new Set((question.options || []).filter(option => option !== question.correct))];
    const answerOptions = shuffled(distractors, random).slice(0, 3);
    const choices = [...answerOptions];
    choices.splice(Math.min(correctSlot, choices.length), 0, question.correct);
    return choices;
  });
}
