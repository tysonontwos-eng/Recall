import { useState } from "react"
import Layout from "../components/Layout.jsx"
import ProgressRing from "../components/ProgressRing.jsx"
import ConfirmModal from "../components/ConfirmModal.jsx"
import { usePassages } from "../hooks/usePassages.js"
import { useNav } from "../router/NavigationContext.js"

export default function Home() {
  const { passages, deletePassage } = usePassages()
  const { navigate } = useNav()
  const [deleteTarget, setDeleteTarget] = useState(null)

  return (
    <Layout>
      <div style={{ paddingTop: "var(--spacing-md)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--spacing-md)" }}>
          <h1>Recall</h1>
          <button
            className="btn btn--primary"
            style={{ width: "auto", padding: "10px 18px" }}
            onClick={() => navigate("add")}
          >
            + New
          </button>
        </div>

        {passages.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-state__icon">◎</div>
            <div className="empty-state__title">No passages yet</div>
            <p>Add a passage to start memorizing.</p>
            <div style={{ marginTop: "var(--spacing-md)" }}>
              <button className="btn btn--primary" onClick={() => navigate("add")}>
                Add your first passage
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {passages.map((p) => (
              <PassageCard
                key={p.id}
                passage={p}
                onClick={() => navigate("passage", { passageId: p.id })}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Delete passage?"
          body={`"${deleteTarget.title}" will be permanently removed.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deletePassage(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
  )
}

function PassageCard({ passage, onClick, onDelete }) {
  return (
    <div
      className="card card--interactive"
      style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}
      onClick={onClick}
    >
      <ProgressRing percent={passage.ringPercent} size={56} strokeWidth={4} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.9375rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {passage.title}
        </div>
        <div className="text-xs text-muted" style={{ marginTop: 3 }}>
          {passage.mode === "long" ? "Long Mode" : "Quick Mode"} ·{" "}
          {passage.totalScore}/{passage.maxScore} pts
        </div>
      </div>
      <button
        className="btn btn--ghost btn--icon"
        style={{ color: "var(--color-text-dim)", fontSize: "1rem" }}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label="Delete passage"
      >
        ×
      </button>
    </div>
  )
}
