// Game IDs, display names, point values, required completions
export const GAME_IDS = {
  TAP_REVEAL: "tap_reveal",
  REORDER: "reorder",
  WORD_BANK: "word_bank",
  FIRST_LETTER: "first_letter",
  FULL_RECALL: "full_recall",
}

// Ordered list of games for a standard chunk/passage sequence
export const GAME_SEQUENCE = [
  GAME_IDS.TAP_REVEAL,
  GAME_IDS.REORDER,
  GAME_IDS.WORD_BANK,
  GAME_IDS.FIRST_LETTER,
  GAME_IDS.FULL_RECALL,
]

// Games used in Cumulative Reviews (skip Tap Reveal)
export const REVIEW_GAME_SEQUENCE = [
  GAME_IDS.REORDER,
  GAME_IDS.FIRST_LETTER,
  GAME_IDS.FULL_RECALL,
]

export const GAME_CONFIG = {
  [GAME_IDS.TAP_REVEAL]: {
    label: "Tap to Reveal",
    icon: "👁",
    maxScore: 5,
    requiredCompletions: 1,
    description: "Reveal each word with a tap",
  },
  [GAME_IDS.REORDER]: {
    label: "Reorder",
    icon: "↕",
    maxScore: 15,
    requiredCompletions: 2,
    description: "Drag blocks into the correct order",
    scorePerRun: [7, 8], // run 1, run 2
  },
  [GAME_IDS.WORD_BANK]: {
    label: "Word Bank",
    icon: "◻",
    maxScore: 20,
    requiredCompletions: 2,
    description: "Fill blanks from the word bank",
    scorePerRun: [10, 10],
  },
  [GAME_IDS.FIRST_LETTER]: {
    label: "First Letter",
    icon: "A",
    maxScore: 25,
    requiredCompletions: 2,
    description: "Every word shown as its first letter",
    scorePerRun: [12, 13],
  },
  [GAME_IDS.FULL_RECALL]: {
    label: "Full Recall",
    icon: "✍",
    maxScore: 35,
    requiredCompletions: 2,
    description: "Type the passage from memory",
    scorePerRun: [17, 18],
  },
}

// Total max score for a single passage/chunk
export const MAX_CHUNK_SCORE = 100

// Max score for a Cumulative Review (no Tap Reveal)
export const MAX_REVIEW_SCORE = 75
