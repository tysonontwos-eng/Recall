// LCS-based word diff for Full Recall scoring
// Aligns user input to expected text to handle insertions/deletions fairly

/**
 * Tokenize text into words (strips punctuation for comparison, keeps original for display)
 * @param {string} text
 * @returns {{ raw: string, normalized: string }[]}
 */
export function tokenize(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({
      raw: w,
      normalized: w.toLowerCase().replace(/[^a-z0-9']/g, ""),
    }))
}

/**
 * Compute LCS-based diff between two token arrays.
 * Returns an array of diff entries aligned to expected tokens.
 * @param {{ raw: string, normalized: string }[]} input
 * @param {{ raw: string, normalized: string }[]} expected
 * @returns {{ word: string, status: "correct"|"wrong"|"missing", inputWord?: string }[]}
 */
export function computeDiff(input, expected) {
  const n = input.length
  const m = expected.length

  // Build LCS DP table
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (input[i - 1].normalized === expected[j - 1].normalized) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to build diff
  const result = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && input[i - 1].normalized === expected[j - 1].normalized) {
      result.push({ word: expected[j - 1].raw, status: "correct" })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ word: expected[j - 1].raw, status: "missing" })
      j--
    } else {
      // Extra word in input — skip it (don't penalize, just ignore)
      i--
    }
  }

  return result.reverse()
}

/**
 * Score a Full Recall attempt.
 * @param {string} inputText
 * @param {string} expectedText
 * @param {number} maxPts - max points for this run
 * @returns {{ score: number, accuracy: number, diff: object[] }}
 */
export function scoreFullRecall(inputText, expectedText, maxPts) {
  const inputTokens = tokenize(inputText)
  const expectedTokens = tokenize(expectedText)

  if (expectedTokens.length === 0) return { score: maxPts, accuracy: 1, diff: [] }

  const diff = computeDiff(inputTokens, expectedTokens)
  const correct = diff.filter((d) => d.status === "correct").length
  const accuracy = correct / expectedTokens.length
  const score = Math.round(accuracy * maxPts)

  return { score, accuracy, diff }
}
