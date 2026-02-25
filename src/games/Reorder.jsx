import { useState, useMemo, useCallback } from "react"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import GameShell from "../components/GameShell.jsx"
import { GAME_CONFIG, GAME_IDS } from "../constants/games.js"

const SCORE_PER_RUN = GAME_CONFIG[GAME_IDS.REORDER].scorePerRun

/** Split text into N roughly equal word-count blocks */
function splitIntoBlocks(text, n = 5) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length < n) {
    // If too short, fewer blocks
    return words.map((w, i) => ({ id: String(i), text: w, originalIndex: i }))
  }
  const blockSize = Math.ceil(words.length / n)
  const blocks = []
  for (let i = 0; i < n; i++) {
    const slice = words.slice(i * blockSize, (i + 1) * blockSize)
    if (slice.length > 0) {
      blocks.push({ id: String(i), text: slice.join(" "), originalIndex: i })
    }
  }
  return blocks
}

/** Fisher-Yates shuffle, guaranteed not in original order */
function shuffleBlocks(blocks) {
  const arr = [...blocks]
  let shuffled
  let attempts = 0
  do {
    shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    attempts++
  } while (
    shuffled.every((b, i) => b.id === arr[i].id) &&
    attempts < 20 &&
    arr.length > 1
  )
  return shuffled
}

function SortableBlock({ id, text, highlight }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  let className = "reorder-block"
  if (isDragging) className += " dragging"
  if (highlight === "correct") className += " reorder-block--correct"
  if (highlight === "wrong") className += " reorder-block--wrong"

  return (
    <div ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
      {text}
    </div>
  )
}

/**
 * Game 2: Reorder
 * 15 pts total, 2 completions required (~7 pts + 8 pts).
 */
export default function Reorder({ text, passageTitle, runNumber, onComplete, onExit }) {
  const originalBlocks = useMemo(() => splitIntoBlocks(text, 5), [text])
  const [blocks, setBlocks] = useState(() => shuffleBlocks(originalBlocks))
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleDragEnd({ active, over }) {
    if (over && active.id !== over.id) {
      setBlocks((b) => {
        const oldIdx = b.findIndex((x) => x.id === active.id)
        const newIdx = b.findIndex((x) => x.id === over.id)
        return arrayMove(b, oldIdx, newIdx)
      })
      setChecked(false)
    }
  }

  function checkOrder() {
    const correct = blocks.every((b, i) => b.id === originalBlocks[i].id)
    setChecked(true)
    setIsCorrect(correct)
    if (correct) {
      setShowResult(true)
    }
  }

  function handleContinue() {
    const pts = SCORE_PER_RUN[runNumber - 1] ?? SCORE_PER_RUN[SCORE_PER_RUN.length - 1]
    onComplete(pts)
  }

  function retryOrder() {
    setBlocks(shuffleBlocks(originalBlocks))
    setChecked(false)
    setIsCorrect(false)
  }

  return (
    <GameShell
      title={passageTitle}
      runCurrent={runNumber}
      runTotal={2}
      onExit={onExit}
    >
      <div style={{ marginBottom: "var(--spacing-sm)" }}>
        <div className="section-label">Reorder</div>
        <p className="text-sm text-muted">Drag the blocks into the correct order, then tap Check.</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="reorder-list">
            {blocks.map((block, i) => (
              <SortableBlock
                key={block.id}
                id={block.id}
                text={block.text}
                highlight={
                  checked
                    ? block.id === originalBlocks[i].id
                      ? "correct"
                      : "wrong"
                    : "none"
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showResult ? (
        <div className="animate-slide-up" style={{ marginTop: "var(--spacing-md)" }}>
          <div className="completion-banner" style={{ marginBottom: "var(--spacing-sm)" }}>
            <div className="completion-banner__title">Correct!</div>
            <div className="completion-banner__sub">
              +{SCORE_PER_RUN[runNumber - 1] ?? SCORE_PER_RUN[SCORE_PER_RUN.length - 1]} points
            </div>
          </div>
          <button className="btn btn--primary" onClick={handleContinue}>
            Continue →
          </button>
        </div>
      ) : (
        <div className="game-shell__footer">
          {checked && !isCorrect && (
            <p className="text-sm text-error" style={{ marginBottom: 10, textAlign: "center" }}>
              Not quite — some blocks are out of order. Try again.
            </p>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            {checked && !isCorrect && (
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={retryOrder}>
                Retry
              </button>
            )}
            <button
              className="btn btn--primary"
              style={{ flex: 2 }}
              onClick={checkOrder}
              disabled={checked && !isCorrect}
            >
              Check Order
            </button>
          </div>
        </div>
      )}
    </GameShell>
  )
}
