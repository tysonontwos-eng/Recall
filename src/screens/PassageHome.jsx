import Layout from "../components/Layout.jsx"
import ProgressRing from "../components/ProgressRing.jsx"
import { usePassage } from "../hooks/usePassage.js"
import { useNav } from "../router/NavigationContext.js"
import { GAME_CONFIG, GAME_SEQUENCE, REVIEW_GAME_SEQUENCE } from "../constants/games.js"

export default function PassageHome({ passageId }) {
  const { state } = usePassage(passageId)
  const { back, navigate } = useNav()

  if (!state) {
    return (
      <Layout>
        <div className="empty-state">
          <div className="empty-state__title">Passage not found</div>
          <button className="btn btn--primary" onClick={back} style={{ marginTop: "var(--spacing-sm)" }}>Go back</button>
        </div>
      </Layout>
    )
  }

  if (state.mode === "quick") {
    return <QuickPassageHome state={state} passageId={passageId} />
  }
  return <LongPassageHome state={state} passageId={passageId} />
}

function QuickPassageHome({ state, passageId }) {
  const { back, navigate } = useNav()
  const { games, score, maxScore } = state.quick
  const ringPercent = Math.round((score / maxScore) * 100)

  return (
    <Layout>
      <div className="screen-header">
        <button className="screen-header__back btn" onClick={back}>←</button>
        <span className="screen-header__title" style={{ flex: 1 }} />
      </div>

      <div style={{ textAlign: "center", padding: "var(--spacing-md) 0 var(--spacing-lg)" }}>
        <ProgressRing percent={ringPercent} size={96} strokeWidth={6} />
        <div style={{ marginTop: "var(--spacing-sm)" }}>
          <div style={{ fontWeight: 700, fontSize: "1.25rem" }}>
            {score} <span className="text-muted" style={{ fontWeight: 400, fontSize: "1rem" }}>/ {maxScore}</span>
          </div>
          <div className="text-muted text-sm" style={{ marginTop: 2 }}>Quick Mode</div>
        </div>
      </div>

      <div className="card">
        {games.map((game, i) => (
          <GameRow
            key={game.gameId}
            game={game}
            onPlay={game.locked ? null : () =>
              navigate("game", {
                passageId,
                gameId: game.gameId,
                gameIndex: i,
                mode: "quick",
                text: state.text,
              })
            }
          />
        ))}
      </div>
    </Layout>
  )
}

function LongPassageHome({ state, passageId }) {
  const { back, navigate } = useNav()
  const { chunks, cumulativeReviews, finalReview } = state.long

  // Compute master ring
  let totalScore = 0, maxScore = 0
  chunks.forEach((c) => { totalScore += c.score; maxScore += 100 })
  cumulativeReviews.forEach((r) => { totalScore += r.score; maxScore += 75 })
  totalScore += finalReview.score
  maxScore += 75 * 2
  const ringPercent = finalReview.done ? 100 : Math.min(99, Math.round((totalScore / maxScore) * 100))

  // Build a flat list: chunks and reviews interleaved
  const items = []
  chunks.forEach((chunk, ci) => {
    items.push({ type: "chunk", data: chunk, index: ci })
    // After every 3rd chunk, insert the corresponding review (if any)
    if ((ci + 1) % 3 === 0) {
      const reviewIndex = Math.floor(ci / 3)
      const review = cumulativeReviews[reviewIndex]
      if (review) items.push({ type: "review", data: review, index: reviewIndex })
    }
  })
  // Final review at end
  items.push({ type: "finalReview", data: finalReview })

  return (
    <Layout>
      <div className="screen-header">
        <button className="screen-header__back btn" onClick={back}>←</button>
        <span className="screen-header__title" style={{ flex: 1 }} />
      </div>

      <div style={{ textAlign: "center", padding: "var(--spacing-md) 0 var(--spacing-lg)" }}>
        <ProgressRing percent={ringPercent} size={96} strokeWidth={6} />
        <div style={{ marginTop: "var(--spacing-sm)" }}>
          <div style={{ fontWeight: 700, fontSize: "1.25rem" }}>
            {totalScore} <span className="text-muted" style={{ fontWeight: 400, fontSize: "1rem" }}>/ {maxScore}</span>
          </div>
          <div className="text-muted text-sm" style={{ marginTop: 2 }}>Long Mode · {chunks.length} sections</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item, i) => {
          if (item.type === "chunk") {
            const chunk = item.data
            const chunkRing = Math.round((chunk.score / 100) * 100)
            return (
              <div
                key={`chunk-${item.index}`}
                className={`card ${chunk.locked ? "" : "card--interactive"}`}
                style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", opacity: chunk.locked ? 0.45 : 1 }}
                onClick={chunk.locked ? undefined : () =>
                  navigate("chunk", { passageId, chunkIndex: item.index })
                }
              >
                <ProgressRing percent={chunkRing} size={44} strokeWidth={3} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                    Section {item.index + 1} of {chunks.length}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                    {chunk.locked ? "Locked" : `${chunk.score}/100 pts`}
                  </div>
                </div>
                {!chunk.locked && <span style={{ color: "var(--color-text-dim)" }}>›</span>}
              </div>
            )
          }

          if (item.type === "review") {
            const review = item.data
            const chunkNums = `${review.chunkRange[0] + 1}–${review.chunkRange[1] + 1}`
            return (
              <ReviewCard
                key={`review-${item.index}`}
                review={review}
                label={`Cumulative Review: Sections ${chunkNums}`}
                requiredLabel="Complete once to unlock next section"
                onClick={() => navigate("cumulative", { passageId, reviewIndex: item.index, isFinal: false })}
              />
            )
          }

          if (item.type === "finalReview") {
            const review = item.data
            return (
              <ReviewCard
                key="final-review"
                review={review}
                label="Final Review — Full Passage"
                requiredLabel="Complete twice to reach 100%"
                onClick={() => navigate("cumulative", { passageId, reviewIndex: -1, isFinal: true })}
              />
            )
          }

          return null
        })}
      </div>
    </Layout>
  )
}

function ReviewCard({ review, label, requiredLabel, onClick }) {
  const ringPercent = review.maxScore > 0
    ? Math.round((review.score / (review.maxScore * review.requiredCompletions)) * 100)
    : 0

  return (
    <div
      className={`card ${review.locked ? "" : "card--interactive"}`}
      style={{
        background: review.locked ? "var(--bg-surface)" : "var(--bg-elevated)",
        borderColor: review.locked ? "var(--color-border)" : "var(--color-accent)",
        borderWidth: review.locked ? 1 : 1.5,
        opacity: review.locked ? 0.4 : 1,
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-sm)",
      }}
      onClick={review.locked ? undefined : onClick}
    >
      <ProgressRing
        percent={review.done ? 100 : ringPercent}
        size={44}
        strokeWidth={3}
        color="var(--color-warning, #f0a04b)"
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{label}</div>
        <div className="text-xs text-muted" style={{ marginTop: 2 }}>
          {review.locked ? "Locked" : review.done ? "Complete ✓" : requiredLabel}
        </div>
      </div>
      {!review.locked && <span style={{ color: "var(--color-text-dim)" }}>›</span>}
    </div>
  )
}

function GameRow({ game, onPlay }) {
  const cfg = GAME_CONFIG[game.gameId]
  const status = game.done ? "done" : game.locked ? "locked" : "active"

  return (
    <div
      className={`game-row ${onPlay ? "card--interactive" : ""}`}
      style={{ cursor: onPlay ? "pointer" : "default", opacity: game.locked ? 0.45 : 1 }}
      onClick={onPlay ?? undefined}
    >
      <div className="game-row__icon" style={{ fontSize: "1rem" }}>{cfg.icon}</div>
      <div className="game-row__info">
        <div className="game-row__name">{cfg.label}</div>
        <div className="game-row__meta">
          {game.done
            ? `${game.score}/${game.maxScore} pts`
            : `Up to ${game.maxScore} pts · ${cfg.requiredCompletions}×`}
        </div>
      </div>
      <div className="game-row__badge">
        {status === "done" && <span className="badge badge--done">✓ Done</span>}
        {status === "locked" && <span className="badge badge--locked">Locked</span>}
        {status === "active" && (
          <span className="badge badge--active">
            {game.completions > 0
              ? `${game.completions}/${game.requiredCompletions}`
              : `${game.maxScore} pts`}
          </span>
        )}
      </div>
    </div>
  )
}
