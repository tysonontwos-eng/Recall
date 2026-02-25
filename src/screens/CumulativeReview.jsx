import Layout from "../components/Layout.jsx"
import ProgressRing from "../components/ProgressRing.jsx"
import { usePassage } from "../hooks/usePassage.js"
import { useNav } from "../router/NavigationContext.js"
import { GAME_CONFIG, REVIEW_GAME_SEQUENCE } from "../constants/games.js"

export default function CumulativeReview({ passageId, reviewIndex, isFinal }) {
  const { state } = usePassage(passageId)
  const { back, navigate } = useNav()

  if (!state || state.mode !== "long") return null

  const review = isFinal
    ? state.long.finalReview
    : state.long.cumulativeReviews[reviewIndex]

  if (!review) return null

  const { chunks } = state.long
  const reviewText = chunks
    .slice(review.chunkRange[0], review.chunkRange[1] + 1)
    .map((c) => c.text)
    .join(" ")

  const sweepsDone = review.sweepsDone ?? 0
  const requiredSweeps = review.requiredSweeps ?? 1

  const ringPercent = review.done
    ? 100
    : Math.round((review.score / review.maxScore) * 100)

  const titleText = isFinal
    ? "Final Review — Full Passage"
    : `Cumulative Review: Sections ${review.chunkRange[0] + 1}–${review.chunkRange[1] + 1}`

  const subText = isFinal
    ? `Complete all three games twice (pass ${sweepsDone + 1} of 2)`
    : "Complete all three games once"

  return (
    <Layout>
      <div className="screen-header">
        <button className="screen-header__back btn" onClick={back}>←</button>
        <span className="screen-header__title">{titleText}</span>
      </div>

      <div style={{ textAlign: "center", padding: "var(--spacing-sm) 0 var(--spacing-md)" }}>
        <ProgressRing
          percent={ringPercent}
          size={72}
          strokeWidth={5}
          color="var(--color-warning, #f0a04b)"
        />
        <div style={{ marginTop: "10px", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {review.score} pts · {subText}
        </div>
        {isFinal && (
          <div className="run-indicator" style={{ justifyContent: "center", marginTop: 8 }}>
            {Array.from({ length: requiredSweeps }, (_, i) => (
              <div
                key={i}
                className={`run-dot ${i < sweepsDone ? "run-dot--done" : ""}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: "var(--spacing-md)", background: "var(--bg-elevated)" }}>
        <p className="passage-text" style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          {reviewText.length > 300 ? reviewText.slice(0, 300) + "…" : reviewText}
        </p>
      </div>

      <div className="card">
        {REVIEW_GAME_SEQUENCE.map((gameId, gi) => {
          const game = review.games[gameId]
          if (!game) return null
          const cfg = GAME_CONFIG[gameId]
          const status = game.done ? "done" : game.locked ? "locked" : "active"

          return (
            <div
              key={gameId}
              className="game-row"
              style={{
                cursor: game.locked ? "default" : "pointer",
                opacity: game.locked ? 0.45 : 1,
              }}
              onClick={game.locked ? undefined : () =>
                navigate("game", {
                  passageId,
                  gameId,
                  gameIndex: gi,
                  mode: "review",
                  reviewIndex: isFinal ? -1 : reviewIndex,
                  isFinal,
                  text: reviewText,
                })
              }
            >
              <div className="game-row__icon" style={{ fontSize: "1rem" }}>{cfg.icon}</div>
              <div className="game-row__info">
                <div className="game-row__name">{cfg.label}</div>
                <div className="game-row__meta">
                  {game.done
                    ? `${game.score}/${game.maxScore} pts`
                    : `${game.maxScore} pts · ${game.requiredCompletions}×`}
                </div>
              </div>
              <div className="game-row__badge">
                {status === "done" && <span className="badge badge--done">✓</span>}
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
        })}
      </div>
    </Layout>
  )
}
