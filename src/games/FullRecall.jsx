import { useState } from "react"
import GameShell from "../components/GameShell.jsx"
import WordDiff from "../components/WordDiff.jsx"
import { scoreFullRecall } from "../utils/scorer.js"
import { GAME_CONFIG, GAME_IDS } from "../constants/games.js"

const SCORE_PER_RUN = GAME_CONFIG[GAME_IDS.FULL_RECALL].scorePerRun

export default function FullRecall({ text, passageTitle, runNumber, onComplete, onExit }) {
  const [inputText, setInputText] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  const maxPts = SCORE_PER_RUN[Math.min(runNumber - 1, SCORE_PER_RUN.length - 1)]

  function handleSubmit() {
    const { score, accuracy, diff } = scoreFullRecall(inputText, text, maxPts)
    setResult({ score, accuracy, diff })
    setSubmitted(true)
  }

  function handleContinue() {
    onComplete(result.score)
  }

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length
  const expectedWords = text.trim().split(/\s+/).filter(Boolean).length

  return (
    <GameShell
      title={passageTitle}
      runCurrent={runNumber}
      runTotal={2}
      onExit={onExit}
    >
      <div style={{ marginBottom: "var(--spacing-sm)" }}>
        <div className="section-label">Full Recall</div>
        <p className="text-sm text-muted">
          Type the passage from memory. Don't worry about perfect punctuation.
        </p>
      </div>

      {!submitted ? (
        <>
          <textarea
            className="full-recall-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Start typing…"
            autoFocus
          />
          <div
            className="text-xs text-muted"
            style={{ marginTop: 6, textAlign: "right" }}
          >
            {wordCount} / ~{expectedWords} words
          </div>
          <div className="game-shell__footer">
            <button
              className="btn btn--primary"
              onClick={handleSubmit}
              disabled={inputText.trim().length === 0}
            >
              Submit
            </button>
          </div>
        </>
      ) : (
        <div className="animate-fade-in">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "var(--spacing-sm)",
            }}
          >
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>
                +{result.score}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                points earned
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                {Math.round(result.accuracy * 100)}%
              </div>
              <div className="text-xs text-muted">accuracy</div>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "var(--bg-elevated)",
              marginBottom: "var(--spacing-md)",
              maxHeight: "280px",
              overflowY: "auto",
            }}
          >
            <WordDiff diff={result.diff} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button className="btn btn--primary" onClick={handleContinue}>
              Continue →
            </button>
          </div>
        </div>
      )}
    </GameShell>
  )
}
