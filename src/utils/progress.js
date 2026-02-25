import {
  GAME_SEQUENCE,
  REVIEW_GAME_SEQUENCE,
  GAME_CONFIG,
  MAX_CHUNK_SCORE,
  MAX_REVIEW_SCORE,
} from "../constants/games.js"

// ─────────────────────────────────────────
// Factory functions
// ─────────────────────────────────────────

function makeGameRecord(gameId, isFirst = false) {
  const cfg = GAME_CONFIG[gameId]
  return {
    gameId,
    completions: 0,
    requiredCompletions: cfg.requiredCompletions,
    score: 0,
    maxScore: cfg.maxScore,
    locked: !isFirst,
    done: false,
  }
}

function makeChunkRecord(chunkIndex, text) {
  return {
    chunkIndex,
    text,
    locked: chunkIndex !== 0,
    games: GAME_SEQUENCE.map((id, i) => makeGameRecord(id, i === 0)),
    score: 0,
    maxScore: MAX_CHUNK_SCORE,
  }
}

/**
 * Every 3rd completed chunk (indices 2, 5, 8, …) triggers a Cumulative Review.
 * reviewIndex 0 = after chunks 0–2, reviewIndex 1 = after chunks 3–5, etc.
 * The final review (isFinal) covers ALL chunks and requires 2 sweeps.
 *
 * A "sweep" = playing all 3 games through their requiredCompletions.
 * sweepsDone tracks how many sweeps have been completed.
 * games tracks game state for the current sweep only; they reset between sweeps.
 */
function makeReviewGames() {
  const games = {}
  REVIEW_GAME_SEQUENCE.forEach((id, i) => {
    games[id] = makeGameRecord(id, i === 0)
  })
  return games
}

function makeCumulativeReviewRecord(reviewIndex, chunkRange, isFinal) {
  return {
    reviewIndex,
    chunkRange, // [startChunkIndex, endChunkIndex] inclusive
    isFinal,
    requiredSweeps: isFinal ? 2 : 1, // how many full passes required
    sweepsDone: 0, // how many full passes completed so far
    locked: true, // unlocks when all chunks in range are done
    done: false,
    games: makeReviewGames(),
    score: 0, // total accumulated across all sweeps
    maxScore: MAX_REVIEW_SCORE * (isFinal ? 2 : 1),
  }
}

/**
 * Reset the games within a review record for the next sweep.
 * Called when sweepsDone increments.
 */
export function makeResetReviewGames() {
  return makeReviewGames()
}

// ─────────────────────────────────────────
// Passage State Initialization
// ─────────────────────────────────────────

/**
 * Initialize a Quick Mode PassageState.
 */
export function initQuickState(id, text) {
  return {
    id,
    mode: "quick",
    text,
    quick: {
      games: GAME_SEQUENCE.map((id, i) => makeGameRecord(id, i === 0)),
      score: 0,
      maxScore: MAX_CHUNK_SCORE,
    },
  }
}

/**
 * Initialize a Long Mode PassageState from an array of chunk strings.
 */
export function initLongState(id, text, chunks) {
  const chunkRecords = chunks.map((t, i) => makeChunkRecord(i, t))

  // Build cumulative reviews: one per 3 chunks
  const cumulativeReviews = []
  const totalChunks = chunks.length

  // Reviews triggered every 3 chunks (not the final one)
  const reviewCount = Math.floor(totalChunks / 3)
  for (let r = 0; r < reviewCount; r++) {
    const start = r * 3
    const end = start + 2
    const isFinal = end >= totalChunks - 1 && r === reviewCount - 1
    if (!isFinal) {
      cumulativeReviews.push(makeCumulativeReviewRecord(r, [start, end], false))
    }
  }

  // Final review covers ALL chunks
  const finalReview = makeCumulativeReviewRecord(
    cumulativeReviews.length,
    [0, totalChunks - 1],
    true
  )

  return {
    id,
    mode: "long",
    text,
    long: {
      chunks: chunkRecords,
      cumulativeReviews,
      finalReview,
    },
  }
}

// ─────────────────────────────────────────
// Lock/Unlock Derivation (pure, no mutations)
// ─────────────────────────────────────────

function isChunkGamesDone(chunk) {
  return chunk.games.every((g) => g.done)
}

function isReviewDone(review) {
  return review.done
}

/**
 * Return which cumulative review (if any) gates chunk at `chunkIndex`.
 * A review gates the NEXT batch of chunks: review[r] gates chunk r*3+3 and beyond.
 */
function gatingReviewForChunk(chunkIndex, cumulativeReviews) {
  if (chunkIndex === 0) return null
  // review[r] covers chunks r*3 through r*3+2.
  // chunk r*3+3 is the first of the next batch — it needs review[r] done.
  for (const review of cumulativeReviews) {
    const nextBatchStart = review.chunkRange[1] + 1
    if (chunkIndex >= nextBatchStart && chunkIndex < nextBatchStart + 3) {
      return review
    }
  }
  return null
}

/**
 * Derive all locked/done states for a Long Mode passage state.
 * Returns a new state object (does not mutate).
 */
export function deriveLockedStates(state) {
  if (state.mode === "quick") return deriveQuickLocks(state)
  return deriveLongLocks(state)
}

function deriveQuickLocks(state) {
  const games = state.quick.games.map((g, i) => {
    const locked = i === 0 ? false : !state.quick.games[i - 1].done
    return { ...g, locked }
  })
  const score = games.reduce((sum, g) => sum + g.score, 0)
  return { ...state, quick: { ...state.quick, games, score } }
}

function deriveLongLocks(state) {
  const { chunks, cumulativeReviews, finalReview } = state.long

  // Update each chunk's game locks
  const newChunks = chunks.map((chunk, ci) => {
    // Determine if chunk itself is locked
    let chunkLocked = false
    if (ci > 0) {
      const prevDone = isChunkGamesDone(chunks[ci - 1])
      if (!prevDone) {
        chunkLocked = true
      } else {
        // Check if there's a gating review
        const gatingReview = gatingReviewForChunk(ci, cumulativeReviews)
        if (gatingReview && !gatingReview.done) {
          chunkLocked = true
        }
      }
    }

    // Update individual game locks within chunk
    const games = chunk.games.map((g, gi) => {
      const locked = chunkLocked || (gi > 0 ? !chunk.games[gi - 1].done : false)
      return { ...g, locked }
    })

    const score = games.reduce((sum, g) => sum + g.score, 0)
    return { ...chunk, locked: chunkLocked, games, score }
  })

  // Helper: derive game locks and done for a review record
  function deriveReviewGames(review, reviewLocked) {
    const gameIds = REVIEW_GAME_SEQUENCE
    const games = {}
    gameIds.forEach((id, gi) => {
      const prevDone = gi === 0 ? true : (games[gameIds[gi - 1]]?.done ?? false)
      const g = review.games[id]
      games[id] = { ...g, locked: reviewLocked || !prevDone }
    })
    return games
  }

  // Update cumulative review locks
  const newReviews = cumulativeReviews.map((review) => {
    const allChunksInRangeDone = newChunks
      .slice(review.chunkRange[0], review.chunkRange[1] + 1)
      .every(isChunkGamesDone)
    const locked = !allChunksInRangeDone

    const games = deriveReviewGames(review, locked)
    const currentSweepScore = Object.values(games).reduce((sum, g) => sum + g.score, 0)
    // sweepsDone is authoritative from state; done = sweepsDone >= requiredSweeps
    const done = review.sweepsDone >= review.requiredSweeps
    return { ...review, locked, games, score: review.score, done }
  })

  // Update final review lock
  const allChunksDone = newChunks.every(isChunkGamesDone)
  const allIntermediateReviewsDone = newReviews.every((r) => r.done)
  const finalLocked = !allChunksDone || !allIntermediateReviewsDone

  const finalGames = deriveReviewGames(finalReview, finalLocked)
  const finalDone = finalReview.sweepsDone >= finalReview.requiredSweeps

  const newFinalReview = {
    ...finalReview,
    locked: finalLocked,
    games: finalGames,
    done: finalDone,
  }

  return {
    ...state,
    long: {
      ...state.long,
      chunks: newChunks,
      cumulativeReviews: newReviews,
      finalReview: newFinalReview,
    },
  }
}

// ─────────────────────────────────────────
// Score / Ring Computation
// ─────────────────────────────────────────

/**
 * Compute totalScore, maxScore, and ringPercent for a passage state.
 */
export function computeTotals(state) {
  if (state.mode === "quick") {
    const totalScore = state.quick.games.reduce((sum, g) => sum + g.score, 0)
    const maxScore = MAX_CHUNK_SCORE
    const ringPercent = Math.min(100, Math.round((totalScore / maxScore) * 100))
    return { totalScore, maxScore, ringPercent }
  }

  // Long mode
  const { chunks, cumulativeReviews, finalReview } = state.long

  let totalScore = 0
  let maxScore = 0

  // Chunk scores
  for (const chunk of chunks) {
    totalScore += chunk.score
    maxScore += MAX_CHUNK_SCORE
  }

  // Intermediate review scores
  for (const review of cumulativeReviews) {
    totalScore += review.score
    maxScore += review.maxScore // MAX_REVIEW_SCORE
  }

  // Final review (maxScore = MAX_REVIEW_SCORE * 2 because requiredSweeps = 2)
  totalScore += finalReview.score
  maxScore += finalReview.maxScore // MAX_REVIEW_SCORE * 2

  // Ring only hits 100% when final review fully done (sweepsDone >= requiredSweeps)
  const rawPercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
  const ringPercent =
    finalReview.done ? 100 : Math.min(99, Math.round(rawPercent))

  return { totalScore, maxScore, ringPercent }
}

// ─────────────────────────────────────────
// PassageMeta from PassageState
// ─────────────────────────────────────────

export function buildMeta(state, existingMeta = {}) {
  const { totalScore, maxScore, ringPercent } = computeTotals(state)
  return {
    ...existingMeta,
    id: state.id,
    mode: state.mode,
    totalScore,
    maxScore,
    ringPercent,
  }
}
