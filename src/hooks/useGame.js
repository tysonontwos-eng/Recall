import { useState } from "react"

/**
 * Simple game run state machine.
 * Tracks which run (1, 2, ...) within a game is active.
 * @param {number} requiredCompletions
 * @param {number} completedSoFar - completions already recorded in state
 */
export function useGame(requiredCompletions, completedSoFar = 0) {
  const remainingRequired = Math.max(0, requiredCompletions - completedSoFar)
  const [runNumber, setRunNumber] = useState(completedSoFar + 1)
  const [phase, setPhase] = useState("playing") // "playing" | "result"

  function onRunComplete() {
    setPhase("result")
  }

  function onNextRun() {
    setRunNumber((r) => r + 1)
    setPhase("playing")
  }

  const totalRun = completedSoFar + runNumber - completedSoFar
  const isRequiredComplete = runNumber > requiredCompletions
  const isExtraRun = runNumber > requiredCompletions

  return {
    runNumber,
    phase,
    isExtraRun,
    isRequiredComplete,
    onRunComplete,
    onNextRun,
  }
}
