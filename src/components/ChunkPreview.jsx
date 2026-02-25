/**
 * Shows auto-split chunks before Long Mode learning begins.
 */
export default function ChunkPreview({ chunks, onStart, onReSplit }) {
  return (
    <div className="animate-fade-in">
      <p className="text-muted" style={{ marginBottom: "var(--spacing-md)" }}>
        Your passage was split into {chunks.length} sections. Review them below, then start learning.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        {chunks.map((text, i) => (
          <div key={i} className="card" style={{ padding: "14px 16px" }}>
            <div className="section-label" style={{ marginBottom: "6px" }}>
              Section {i + 1} of {chunks.length}
            </div>
            <p className="passage-text" style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}>
              {text}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "var(--spacing-md)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <button className="btn btn--primary" onClick={onStart}>
          Start Learning
        </button>
        <button className="btn btn--secondary" onClick={onReSplit} style={{ width: "100%" }}>
          Re-split
        </button>
      </div>
    </div>
  )
}
