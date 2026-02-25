import Layout from "../components/Layout.jsx"
import ProgressRing from "../components/ProgressRing.jsx"
import { usePassage } from "../hooks/usePassage.js"
import { useNav } from "../router/NavigationContext.js"
import { GAME_CONFIG, GAME_SEQUENCE } from "../constants/games.js"

export default function ChunkScreen({ passageId, chunkIndex }) {
  const { state } = usePassage(passageId)
  const { back, navigate } = useNav()

  if (!state || state.mode !== "long") return null

  const chunk = state.long.chunks[chunkIndex]
  const totalChunks = state.long.chunks.length
  if (!chunk) return null

  const ringPercent = Math.round((chunk.score / 100) * 100)

  return (
    <Layout>
      <div className="screen-header">
        <button className="screen-header__back btn" onClick={back}>←</button>
        <span className="screen-header__title">
          Section {chunkIndex + 1} of {totalChunks}
        </span>
      </div>

      <div style={{ textAlign: "center", padding: "var(--spacing-sm) 0 var(--spacing-md)" }}>
        <ProgressRing percent={ringPercent} size={72} strokeWidth={5} />
        <div style={{ marginTop: "10px", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {chunk.score}/100 pts
        </div>
      </div>

      <div
        className="card"
        style={{ marginBottom: "var(--spacing-md)", background: "var(--bg-elevated)" }}
      >
        <p className="passage-text" style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          {chunk.text}
        </p>
      </div>

      <div className="card">
        {chunk.games.map((game, gi) => (
          <ChunkGameRow
            key={game.gameId}
            game={game}
            onPlay={game.locked ? null : () =>
              navigate("game", {
                passageId,
                gameId: game.gameId,
                gameIndex: gi,
                mode: "chunk",
                chunkIndex,
                text: chunk.text,
              })
            }
          />
        ))}
      </div>
    </Layout>
  )
}

function ChunkGameRow({ game, onPlay }) {
  const cfg = GAME_CONFIG[game.gameId]
  const status = game.done ? "done" : game.locked ? "locked" : "active"

  return (
    <div
      className="game-row"
      style={{
        cursor: onPlay ? "pointer" : "default",
        opacity: game.locked ? 0.45 : 1,
      }}
      onClick={onPlay ?? undefined}
    >
      <div className="game-row__icon" style={{ fontSize: "1rem" }}>{cfg.icon}</div>
      <div className="game-row__info">
        <div className="game-row__name">{cfg.label}</div>
        <div className="game-row__meta">
          {game.done
            ? `${game.score}/${game.maxScore} pts`
            : `${game.maxScore} pts · ${cfg.requiredCompletions}×`}
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
}
