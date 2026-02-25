import { useState, useCallback } from "react"
import { getPassageState, setPassageState, getPassages, setPassages } from "../utils/storage.js"
import { deriveLockedStates, buildMeta, makeResetReviewGames } from "../utils/progress.js"

export function usePassage(id) {
  const [state, setState] = useState(() => {
    const s = getPassageState(id)
    if (!s) return null
    return deriveLockedStates(s)
  })

  function persist(newState) {
    const derived = deriveLockedStates(newState)

    // Update passage meta in the index
    const passages = getPassages()
    const meta = passages.find((p) => p.id === id)
    if (meta) {
      const newMeta = buildMeta(derived, meta)
      const updated = passages.map((p) => (p.id === id ? newMeta : p))
      setPassages(updated)
    }

    setPassageState(id, derived)
    setState(derived)
    return derived
  }

  /**
   * Record a game completion for Quick Mode.
   * @param {number} gameIndex - index in GAME_SEQUENCE (0–4)
   * @param {number} scoreEarned
   */
  const recordQuickCompletion = useCallback((gameIndex, scoreEarned) => {
    if (!state || state.mode !== "quick") return
    const games = state.quick.games.map((g, i) => {
      if (i !== gameIndex) return g
      const newCompletions = g.completions + 1
      const done = newCompletions >= g.requiredCompletions
      return { ...g, completions: newCompletions, score: g.score + scoreEarned, done }
    })
    const newState = { ...state, quick: { ...state.quick, games } }
    return persist(newState)
  }, [state])

  /**
   * Record a game completion for a Long Mode chunk.
   * @param {number} chunkIndex
   * @param {number} gameIndex - index in GAME_SEQUENCE
   * @param {number} scoreEarned
   */
  const recordChunkCompletion = useCallback((chunkIndex, gameIndex, scoreEarned) => {
    if (!state || state.mode !== "long") return
    const chunks = state.long.chunks.map((chunk, ci) => {
      if (ci !== chunkIndex) return chunk
      const games = chunk.games.map((g, gi) => {
        if (gi !== gameIndex) return g
        const newCompletions = g.completions + 1
        const done = newCompletions >= g.requiredCompletions
        return { ...g, completions: newCompletions, score: g.score + scoreEarned, done }
      })
      return { ...chunk, games }
    })
    const newState = { ...state, long: { ...state.long, chunks } }
    return persist(newState)
  }, [state])

  /**
   * Record a game completion within a Cumulative Review.
   * Updates the game's completions/score. If all games complete a sweep,
   * sweepsDone increments and games reset for the next sweep (if needed).
   *
   * @param {number} reviewIndex - index in cumulativeReviews (-1 = final)
   * @param {boolean} isFinal
   * @param {string} gameId
   * @param {number} scoreEarned
   */
  const recordReviewGameCompletion = useCallback((reviewIndex, isFinal, gameId, scoreEarned) => {
    if (!state || state.mode !== "long") return

    function applyToReview(review) {
      const game = review.games[gameId]
      if (!game) return review

      const newCompletions = game.completions + 1
      const done = newCompletions >= game.requiredCompletions
      const updatedGame = {
        ...game,
        completions: newCompletions,
        score: game.score + scoreEarned,
        done,
      }
      const updatedGames = { ...review.games, [gameId]: updatedGame }

      // Check if all games are now done → sweep complete
      const allGamesDone = Object.values(updatedGames).every((g) => g.done)
      let newSweepsDone = review.sweepsDone
      let newGames = updatedGames
      let newScore = review.score + scoreEarned

      if (allGamesDone) {
        newSweepsDone = review.sweepsDone + 1
        const done = newSweepsDone >= review.requiredSweeps
        if (!done) {
          // Reset games for the next sweep
          newGames = makeResetReviewGames()
        }
      }

      return {
        ...review,
        games: newGames,
        score: newScore,
        sweepsDone: newSweepsDone,
        done: newSweepsDone >= review.requiredSweeps,
      }
    }

    if (isFinal) {
      const updatedFinal = applyToReview(state.long.finalReview)
      const newState = { ...state, long: { ...state.long, finalReview: updatedFinal } }
      return persist(newState)
    } else {
      const cumulativeReviews = state.long.cumulativeReviews.map((review, ri) =>
        ri === reviewIndex ? applyToReview(review) : review
      )
      const newState = { ...state, long: { ...state.long, cumulativeReviews } }
      return persist(newState)
    }
  }, [state])

  return {
    state,
    recordQuickCompletion,
    recordChunkCompletion,
    recordReviewGameCompletion,
  }
}
