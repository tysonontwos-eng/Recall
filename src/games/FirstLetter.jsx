import { useState, useRef, useEffect, useCallback } from "react"
import GameShell from "../components/GameShell.jsx"
import { GAME_CONFIG, GAME_IDS } from "../constants/games.js"

const SCORE_PER_RUN = GAME_CONFIG[GAME_IDS.FIRST_LETTER].scorePerRun

/** Replace word characters after the first with underscores */
function maskWord(word) {
  const match = word.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9])(.*)$/)
  if (!match) return word
  const [, pre, first, rest] = match
  const masked = rest.replace(/[a-zA-Z0-9]/g, "_")
  return pre + first + masked
}

export default function FirstLetter({ text, passageTitle, runNumber, onComplete, onExit }) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const [filled, setFilled] = useState(new Array(words.length).fill(false))
  const [active, setActive] = useState(null)
  const [shakeIndex, setShakeIndex] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const inputRef = useRef(null)

  // Auto-advance: find first unfilled
  useEffect(() => {
    const first = filled.findIndex((f) => !f)
    if (first !== -1) setActive(first)
  }, [])

  useEffect(() => {
    if (active !== null && inputRef.current) {
      inputRef.current.focus()
    }
  }, [active])

  function handleBlankClick(i) {
    if (submitted) return
    setActive(i)
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  function handleKeyDown(e) {
    if (active === null) return
    const key = e.key

    // Accept any printable character (1 char)
    if (key.length === 1) {
      const expected = words[active]
      const firstChar = expected.replace(/^[^a-zA-Z0-9]*/, "")[0]

      if (key.toLowerCase() === firstChar?.toLowerCase()) {
        // Correct
        const newFilled = [...filled]
        newFilled[active] = true
        setFilled(newFilled)

        const allDone = newFilled.every(Boolean)
        if (allDone) {
          handleSubmit(newFilled)
        } else {
          // Advance to next blank
          const next = newFilled.findIndex((f, i) => !f && i > active)
          const wrap = newFilled.findIndex((f) => !f)
          setActive(next !== -1 ? next : wrap !== -1 ? wrap : null)
        }
      } else {
        // Wrong — shake and clear
        setShakeIndex(active)
        setTimeout(() => setShakeIndex(null), 400)
      }
    }

    if (key === "Tab") {
      e.preventDefault()
      const next = filled.findIndex((f, i) => !f && i > active)
      const wrap = filled.findIndex((f) => !f)
      setActive(next !== -1 ? next : wrap !== -1 ? wrap : null)
    }

    if (key === "Escape") {
      setActive(null)
    }
  }

  function handleSubmit(finalFilled = filled) {
    const correct = finalFilled.filter(Boolean).length
    const pct = correct / words.length
    const maxPts = SCORE_PER_RUN[Math.min(runNumber - 1, SCORE_PER_RUN.length - 1)]
    const earned = Math.round(pct * maxPts)
    setScore(earned)
    setSubmitted(true)
    setActive(null)
  }

  function handleContinue() {
    onComplete(score)
  }

  const correctCount = filled.filter(Boolean).length

  return (
    <GameShell
      title={passageTitle}
      runCurrent={runNumber}
      runTotal={2}
      onExit={onExit}
    >
      {/* Hidden input receives keyboard events */}
      <input
        ref={inputRef}
        style={{
          position: "fixed",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
          top: 0,
          left: 0,
        }}
        onKeyDown={handleKeyDown}
        readOnly
        aria-hidden="true"
      />

      <div style={{ marginBottom: "var(--spacing-sm)" }}>
        <div className="section-label">First Letter</div>
        <p className="text-sm text-muted">
          Tap a blank and type the word. Only the first letter must match.
        </p>
      </div>

      <div className="first-letter-passage">
        {words.map((word, i) => {
          const isDone = filled[i]
          const isActive = active === i
          const isShaking = shakeIndex === i
          const masked = maskWord(word)

          let className = "fl-blank"
          if (submitted) className += " fl-blank--correct"
          else if (isActive) className += " fl-blank--active"
          if (isShaking) className += " fl-blank--shake"

          return (
            <span key={i}>
              <button
                className={className}
                onClick={() => !isDone && handleBlankClick(i)}
                style={{ cursor: isDone || submitted ? "default" : "pointer" }}
                tabIndex={-1}
              >
                {isDone || submitted ? word : masked}
              </button>
              {" "}
            </span>
          )
        })}
      </div>

      {!submitted && (
        <div style={{ marginTop: "var(--spacing-sm)", color: "var(--color-text-dim)", fontSize: "0.8125rem" }}>
          {correctCount}/{words.length} words
        </div>
      )}

      {submitted && (
        <div className="animate-slide-up" style={{ marginTop: "var(--spacing-md)" }}>
          <div className="completion-banner" style={{ marginBottom: "var(--spacing-sm)" }}>
            <div className="completion-banner__title">
              {correctCount === words.length ? "Perfect!" : "Complete"}
            </div>
            <div className="completion-banner__sub">
              +{score} points · {correctCount}/{words.length} correct
            </div>
          </div>
          <button className="btn btn--primary" onClick={handleContinue}>Continue →</button>
        </div>
      )}
    </GameShell>
  )
}
