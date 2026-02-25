import { useState } from "react"
import GameShell from "../components/GameShell.jsx"

/**
 * Game 1: Tap to Reveal
 * 5 pts, 1 completion required.
 * Passage hidden; each tap reveals the next word.
 */
export default function TapReveal({ text, passageTitle, onComplete, onExit }) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const [revealed, setRevealed] = useState(0)
  const [finished, setFinished] = useState(false)

  function revealNext() {
    if (revealed < words.length) {
      setRevealed((r) => {
        const next = r + 1
        if (next === words.length) {
          setFinished(true)
        }
        return next
      })
    }
  }

  function handleComplete() {
    onComplete(5) // always 5 pts
  }

  return (
    <GameShell
      title={passageTitle}
      runCurrent={1}
      runTotal={1}
      onExit={onExit}
    >
      <div style={{ marginBottom: "var(--spacing-sm)" }}>
        <div className="section-label">Tap to Reveal</div>
        <p className="text-sm text-muted">Tap the next hidden word to reveal it.</p>
      </div>

      <div className="tap-reveal" onClick={!finished ? revealNext : undefined} style={{ cursor: finished ? "default" : "pointer" }}>
        {words.map((word, i) => {
          const isRevealed = i < revealed
          const isNext = i === revealed

          return (
            <span key={i}>
              <span
                className={`tap-reveal__word ${
                  isRevealed
                    ? "tap-reveal__word--revealed"
                    : isNext
                    ? "tap-reveal__word--hidden tap-reveal__word--next"
                    : "tap-reveal__word--hidden"
                }`}
                // Show blank of similar width to word
                style={!isRevealed ? { minWidth: `${Math.max(2, word.length * 0.6)}ch` } : undefined}
              >
                {isRevealed ? word : "\u00a0"}
              </span>
              {" "}
            </span>
          )
        })}
      </div>

      {finished && (
        <div className="game-shell__footer animate-slide-up">
          <div className="completion-banner" style={{ marginBottom: "var(--spacing-sm)" }}>
            <div className="completion-banner__title">Complete!</div>
            <div className="completion-banner__sub">+5 points</div>
          </div>
          <button className="btn btn--primary" onClick={handleComplete}>
            Continue →
          </button>
        </div>
      )}
    </GameShell>
  )
}
