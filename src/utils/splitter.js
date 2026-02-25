// Auto-split algorithm for Long Mode
// Splits text into natural 2–3 sentence chunks

const ABBREVIATIONS = [
  "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.", "St.",
  "vs.", "etc.", "i.e.", "e.g.", "cf.", "et al.", "fig.",
  "Jan.", "Feb.", "Mar.", "Apr.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
]

// Replace abbreviations with a placeholder to avoid false sentence splits
function maskAbbreviations(text) {
  let masked = text
  ABBREVIATIONS.forEach((abbr, i) => {
    masked = masked.split(abbr).join(`__ABBR${i}__`)
  })
  return masked
}

function restoreAbbreviations(text) {
  let restored = text
  ABBREVIATIONS.forEach((abbr, i) => {
    restored = restored.split(`__ABBR${i}__`).join(abbr)
  })
  return restored
}

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length
}

// Split text into individual sentences
function toSentences(text) {
  const masked = maskAbbreviations(text.trim().replace(/\s+/g, " "))
  // Split after .!? followed by whitespace + uppercase or quote
  const parts = masked.split(/(?<=[.!?])\s+(?=[A-Z"'""''\[])/)
  return parts
    .map((s) => restoreAbbreviations(s.trim()))
    .filter(Boolean)
}

// Merge sentences that are too short into their neighbor
function mergeShortSentences(sentences, minWords) {
  if (sentences.length <= 1) return sentences

  const result = [...sentences]
  let changed = true

  while (changed) {
    changed = false
    for (let i = 0; i < result.length; i++) {
      if (countWords(result[i]) < minWords && result.length > 1) {
        if (i === 0) {
          // Merge first into second
          result[1] = result[0] + " " + result[1]
          result.splice(0, 1)
        } else {
          // Merge into previous
          result[i - 1] = result[i - 1] + " " + result[i]
          result.splice(i, 1)
        }
        changed = true
        break
      }
    }
  }

  return result
}

// Group sentences into chunks of 2–3 sentences, ~15+ words preferred
function groupIntoChunks(sentences, targetSentences = 3, minWords = 15) {
  const chunks = []
  let current = []
  let currentWords = 0

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i]
    const wc = countWords(s)
    current.push(s)
    currentWords += wc

    const isLast = i === sentences.length - 1
    const reachedTarget = current.length >= targetSentences
    const hasEnoughWords = currentWords >= minWords

    if (!isLast && (reachedTarget || (current.length >= 2 && hasEnoughWords))) {
      chunks.push(current.join(" "))
      current = []
      currentWords = 0
    }
  }

  if (current.length > 0) {
    // Merge tiny leftover into previous chunk if it's very short
    if (chunks.length > 0 && currentWords < 8) {
      chunks[chunks.length - 1] = chunks[chunks.length - 1] + " " + current.join(" ")
    } else {
      chunks.push(current.join(" "))
    }
  }

  return chunks
}

/**
 * Split a text passage into natural chunks for Long Mode.
 * @param {string} text
 * @param {Object} opts
 * @param {number} opts.minSentenceWords - sentences shorter than this merge into neighbor (default 6)
 * @param {number} opts.targetSentences - target sentences per chunk (default 3)
 * @param {number} opts.minChunkWords - min words before flushing a chunk (default 15)
 * @returns {string[]} Array of chunk strings
 */
export function splitPassage(text, opts = {}) {
  const {
    minSentenceWords = 6,
    targetSentences = 3,
    minChunkWords = 15,
  } = opts

  const sentences = toSentences(text)
  if (sentences.length === 0) return [text.trim()]
  if (sentences.length <= 2) return [text.trim()]

  const merged = mergeShortSentences(sentences, minSentenceWords)
  return groupIntoChunks(merged, targetSentences, minChunkWords)
}

/**
 * Alternative split with different parameters (for Re-split button).
 * @param {string} text
 * @returns {string[]}
 */
export function reSplitPassage(text) {
  return splitPassage(text, {
    minSentenceWords: 4,
    targetSentences: 2,
    minChunkWords: 12,
  })
}
