import { useState } from "react"
import { useNav } from "../router/NavigationContext.js"
import { usePassage } from "../hooks/usePassage.js"
import { GAME_IDS, GAME_CONFIG, GAME_SEQUENCE, REVIEW_GAME_SEQUENCE } from "../constants/games.js"
import TapReveal from "../games/TapReveal.jsx"
import Reorder from "../games/Reorder.jsx"
import WordBank from "../games/WordBank.jsx"
import FirstLetter from "../games/FirstLetter.jsx"
import FullRecall from "../games/FullRecall.jsx"

/**
 * Hosts the active game component and connects it to passage state persistence.
 *
 * params:
 *   passageId: string
 *   gameId: GAME_IDS value
 *   gameIndex: number (index in GAME_SEQUENCE or REVIEW_GAME_SEQUENCE)
 *   mode: "quick" | "chunk" | "review"
 *   text: string (the passage/chunk/review text to use)
 *   chunkIndex?: number (Long Mode chunks)
 *   reviewIndex?: number (-1 for final review)
 *   isFinal?: boolean
 */
export default function GameScreen({
  passageId,
  gameId,
  gameIndex,
  mode,
  text,
  chunkIndex,
  reviewIndex,
  isFinal,
}) {
  const { back } = useNav()
  const { state, recordQuickCompletion, recordChunkCompletion, recordReviewGameCompletion } =
    usePassage(passageId)

  // Which run are we on? Determine from current completions.
  const currentCompletions = getCompletions(state, mode, gameIndex, chunkIndex, reviewIndex, isFinal, gameId)
  const requiredCompletions = GAME_CONFIG[gameId]?.requiredCompletions ?? 1

  // Track run within this GameScreen mount
  const [run, setRun] = useState(currentCompletions + 1)
  const isExtraRun = run > requiredCompletions

  const passageTitle = getPassageTitle(state, mode, chunkIndex, isFinal, reviewIndex)

  function handleComplete(scoreEarned) {
    // Record to state
    if (mode === "quick") {
      recordQuickCompletion(gameIndex, scoreEarned)
    } else if (mode === "chunk") {
      recordChunkCompletion(chunkIndex, gameIndex, scoreEarned)
    } else if (mode === "review") {
      recordReviewGameCompletion(reviewIndex, isFinal, gameId, scoreEarned)
    }

    const nextRun = run + 1
    const doneWithRequired = nextRun > requiredCompletions

    if (doneWithRequired) {
      // Navigate back to source screen
      back()
    } else {
      // Next run of same game
      setRun(nextRun)
    }
  }

  function handleExit() {
    back()
  }

  const gameProps = {
    text,
    passageTitle,
    runNumber: run,
    onComplete: handleComplete,
    onExit: handleExit,
  }

  switch (gameId) {
    case GAME_IDS.TAP_REVEAL:
      return <TapReveal {...gameProps} />
    case GAME_IDS.REORDER:
      return <Reorder {...gameProps} />
    case GAME_IDS.WORD_BANK:
      return <WordBank {...gameProps} />
    case GAME_IDS.FIRST_LETTER:
      return <FirstLetter {...gameProps} />
    case GAME_IDS.FULL_RECALL:
      return <FullRecall {...gameProps} />
    default:
      return <div style={{ padding: "var(--spacing-lg)", color: "var(--color-error)" }}>Unknown game: {gameId}</div>
  }
}

function getCompletions(state, mode, gameIndex, chunkIndex, reviewIndex, isFinal, gameId) {
  if (!state) return 0
  try {
    if (mode === "quick") {
      return state.quick.games[gameIndex]?.completions ?? 0
    }
    if (mode === "chunk") {
      return state.long.chunks[chunkIndex]?.games[gameIndex]?.completions ?? 0
    }
    if (mode === "review") {
      const review = isFinal
        ? state.long.finalReview
        : state.long.cumulativeReviews[reviewIndex]
      return review?.games[gameId]?.completions ?? 0
    }
  } catch {
    return 0
  }
  return 0
}

function getPassageTitle(state, mode, chunkIndex, isFinal, reviewIndex) {
  if (!state) return ""
  if (mode === "chunk") {
    const total = state.long?.chunks?.length ?? 0
    return `Section ${chunkIndex + 1} of ${total}`
  }
  if (mode === "review") {
    if (isFinal) return "Final Review"
    const review = state.long?.cumulativeReviews?.[reviewIndex]
    if (review) {
      return `Review: §${review.chunkRange[0] + 1}–${review.chunkRange[1] + 1}`
    }
  }
  return ""
}
