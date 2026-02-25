import { useState } from "react"
import ConfirmModal from "./ConfirmModal.jsx"

/**
 * Wrapper for game screens. Provides header with back button, title, run indicator.
 */
export default function GameShell({ title, runCurrent, runTotal, onExit, children }) {
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  function handleBackClick() {
    setShowExitConfirm(true)
  }

  return (
    <div className="game-shell">
      <div className="game-shell__header">
        <button className="btn btn--ghost btn--icon" onClick={handleBackClick} aria-label="Exit game">
          ←
        </button>
        <span className="game-shell__title">{title}</span>
        {runTotal > 1 && (
          <div className="run-indicator" aria-label={`Run ${runCurrent} of ${runTotal}`}>
            {Array.from({ length: runTotal }, (_, i) => (
              <div
                key={i}
                className={`run-dot ${
                  i < runCurrent - 1
                    ? "run-dot--done"
                    : i === runCurrent - 1
                    ? "run-dot--active"
                    : ""
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="game-shell__body">{children}</div>

      {showExitConfirm && (
        <ConfirmModal
          title="Exit game?"
          body="Your progress in this run will be lost."
          confirmLabel="Exit"
          cancelLabel="Keep playing"
          danger
          onConfirm={() => {
            setShowExitConfirm(false)
            onExit()
          }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  )
}
