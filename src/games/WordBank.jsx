import { useState, useMemo } from "react"
import GameShell from "../components/GameShell.jsx"
import { GAME_CONFIG, GAME_IDS } from "../constants/games.js"

const SCORE_PER_RUN = GAME_CONFIG[GAME_IDS.WORD_BANK].scorePerRun

/** Tokenize text into tokens preserving spaces/punctuation */
function tokenizePassage(text) {
  // Split into words and non-word separators
  return text.trim().split(/(\s+)/).filter(Boolean)
}

/** Pick which word indices to blank for a given run */
function selectBlanks(tokens, run) {
  const wordIndices = []
  tokens.forEach((token, i) => {
    if (/\S/.test(token) && !/^\s+$/.test(token)) {
      wordIndices.push(i)
    }
  })

  if (run === 1) {
    // All words
    return new Set(wordIndices)
  }

  // Run 2: ~60% of words, favor longer/harder words
  const wordTokens = wordIndices.map((i) => ({
    index: i,
    word: tokens[i].replace(/[^a-zA-Z0-9']/g, ""),
  }))

  // Sort by length descending
  const sorted = [...wordTokens].sort((a, b) => b.word.length - a.word.length)
  const targetCount = Math.ceil(wordTokens.length * 0.6)

  // Take top N by length
  const chosen = sorted.slice(0, targetCount)
  return new Set(chosen.map((w) => w.index))
}

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function WordBank({ text, passageTitle, runNumber, onComplete, onExit }) {
  const tokens = useMemo(() => tokenizePassage(text), [text])
  const blankedIndices = useMemo(() => selectBlanks(tokens, runNumber), [tokens, runNumber])

  // Bank: shuffled list of blank words
  const [bank, setBank] = useState(() => {
    const words = []
    blankedIndices.forEach((i) => words.push({ id: String(i), word: tokens[i] }))
    return shuffle(words)
  })

  // filled: Map<tokenIndex, word string>
  const [filled, setFilled] = useState(new Map())
  // Which blank is currently selected (token index)
  const [selectedBlank, setSelectedBlank] = useState(null)
  // Which bank chip is selected
  const [selectedChip, setSelectedChip] = useState(null)
  // Submitted state
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [mustRetry, setMustRetry] = useState(false)

  function handleBlankClick(tokenIndex) {
    if (submitted) return
    if (selectedChip !== null) {
      // Fill this blank with the selected chip
      fillBlank(tokenIndex, selectedChip)
      setSelectedChip(null)
      setSelectedBlank(null)
    } else if (filled.has(tokenIndex)) {
      // Return the word to bank
      const word = filled.get(tokenIndex)
      setFilled((prev) => {
        const next = new Map(prev)
        next.delete(tokenIndex)
        return next
      })
      setBank((prev) => [{ id: String(tokenIndex), word }, ...prev])
      setSelectedBlank(null)
    } else {
      setSelectedBlank(tokenIndex === selectedBlank ? null : tokenIndex)
    }
  }

  function handleChipClick(chipId) {
    if (submitted) return
    if (selectedBlank !== null) {
      fillBlank(selectedBlank, chipId)
      setSelectedBlank(null)
      setSelectedChip(null)
    } else {
      setSelectedChip(chipId === selectedChip ? null : chipId)
    }
  }

  function fillBlank(tokenIndex, chipId) {
    const chip = bank.find((c) => c.id === chipId)
    if (!chip) return

    // If blank was already filled, return old word to bank first
    setFilled((prev) => {
      const next = new Map(prev)
      if (next.has(tokenIndex)) {
        const oldWord = next.get(tokenIndex)
        setBank((b) => [{ id: String(tokenIndex), word: oldWord }, ...b.filter((c) => c.id !== chipId)])
      } else {
        setBank((b) => b.filter((c) => c.id !== chipId))
      }
      next.set(tokenIndex, chip.word)
      return next
    })
  }

  function handleSubmit() {
    if (filled.size < blankedIndices.size) return // not all filled

    let correct = 0
    blankedIndices.forEach((i) => {
      const expected = tokens[i].toLowerCase().replace(/[^a-z0-9']/g, "")
      const given = (filled.get(i) || "").toLowerCase().replace(/[^a-z0-9']/g, "")
      if (expected === given) correct++
    })

    const runMaxPts = SCORE_PER_RUN[Math.min(runNumber - 1, SCORE_PER_RUN.length - 1)]
    const pct = correct / blankedIndices.size
    const earnedScore = pct === 1 ? runMaxPts : Math.round(pct * runMaxPts)

    setScore(earnedScore)
    setSubmitted(true)

    if (pct < 1) {
      setMustRetry(true)
    }
  }

  function handleRetry() {
    // Reset run
    setFilled(new Map())
    const words = []
    blankedIndices.forEach((i) => words.push({ id: String(i), word: tokens[i] }))
    setBank(shuffle(words))
    setSubmitted(false)
    setMustRetry(false)
    setSelectedBlank(null)
    setSelectedChip(null)
  }

  function handleContinue() {
    onComplete(score)
  }

  const allFilled = filled.size >= blankedIndices.size

  return (
    <GameShell
      title={passageTitle}
      runCurrent={runNumber}
      runTotal={2}
      onExit={onExit}
    >
      <div style={{ marginBottom: "var(--spacing-sm)" }}>
        <div className="section-label">Word Bank</div>
        <p className="text-sm text-muted">
          {runNumber === 1 ? "Tap a blank, then tap a word." : "~60% of words are hidden. Fill them in."}
        </p>
      </div>

      <div className="word-bank-passage">
        {tokens.map((token, i) => {
          if (/^\s+$/.test(token)) return <span key={i}>{token}</span>

          if (!blankedIndices.has(i)) {
            return <span key={i}>{token}</span>
          }

          const filledWord = filled.get(i)
          const isSelected = selectedBlank === i
          const expected = tokens[i]

          let blankClass = "word-bank-blank"
          if (submitted) {
            const correct = (filledWord || "").toLowerCase().replace(/[^a-z0-9']/g, "") ===
              expected.toLowerCase().replace(/[^a-z0-9']/g, "")
            blankClass += correct ? " word-bank-blank--correct" : " word-bank-blank--wrong"
          } else if (filledWord) {
            blankClass += isSelected ? " word-bank-blank--selected" : " word-bank-blank--filled"
          } else {
            blankClass += isSelected ? " word-bank-blank--selected" : " word-bank-blank--empty"
          }

          return (
            <button
              key={i}
              className={blankClass}
              onClick={() => handleBlankClick(i)}
              style={{ minWidth: `${Math.max(3, expected.length * 0.65)}ch` }}
            >
              {filledWord || "\u00a0"}
            </button>
          )
        })}
      </div>

      {!submitted && (
        <div className="word-bank-pool">
          {bank.map((chip) => (
            <button
              key={chip.id}
              className={`word-bank-chip ${selectedChip === chip.id ? "word-bank-chip--selected" : ""}`}
              onClick={() => handleChipClick(chip.id)}
            >
              {chip.word}
            </button>
          ))}
        </div>
      )}

      {submitted ? (
        <div className="animate-slide-up" style={{ marginTop: "var(--spacing-md)" }}>
          {mustRetry ? (
            <>
              <div className="completion-banner" style={{ marginBottom: "var(--spacing-sm)", background: "rgba(224,92,92,0.1)", borderColor: "rgba(224,92,92,0.25)" }}>
                <div className="completion-banner__title" style={{ color: "var(--color-error)" }}>
                  Some words wrong
                </div>
                <div className="completion-banner__sub">You must get 100% to continue.</div>
              </div>
              <button className="btn btn--primary" onClick={handleRetry}>Try Again</button>
            </>
          ) : (
            <>
              <div className="completion-banner" style={{ marginBottom: "var(--spacing-sm)" }}>
                <div className="completion-banner__title">
                  {score === SCORE_PER_RUN[Math.min(runNumber - 1, 1)] ? "Perfect!" : "Complete!"}
                </div>
                <div className="completion-banner__sub">+{score} points</div>
              </div>
              <button className="btn btn--primary" onClick={handleContinue}>Continue →</button>
            </>
          )}
        </div>
      ) : (
        <div className="game-shell__footer">
          <button
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={!allFilled}
          >
            Submit
          </button>
        </div>
      )}
    </GameShell>
  )
}
