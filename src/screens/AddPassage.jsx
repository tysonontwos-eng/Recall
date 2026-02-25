import { useState } from "react"
import Layout from "../components/Layout.jsx"
import ChunkPreview from "../components/ChunkPreview.jsx"
import { usePassages } from "../hooks/usePassages.js"
import { useNav } from "../router/NavigationContext.js"
import { splitPassage, reSplitPassage } from "../utils/splitter.js"

export default function AddPassage() {
  const { navigate, back } = useNav()
  const { addPassage } = usePassages()

  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [mode, setMode] = useState("quick")
  const [previewChunks, setPreviewChunks] = useState(null)
  const [splitCount, setSplitCount] = useState(0)

  const canSubmit = text.trim().length > 10

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    if (mode === "long" && !previewChunks) {
      // Show chunk preview first
      const chunks = splitPassage(text)
      setPreviewChunks(chunks)
      setSplitCount(0)
      return
    }

    // Create passage
    const id = addPassage(title, text, mode)
    navigate("passage", { passageId: id })
  }

  function handleReSplit() {
    const chunks = splitCount % 2 === 0 ? reSplitPassage(text) : splitPassage(text)
    setPreviewChunks(chunks)
    setSplitCount((n) => n + 1)
  }

  function handleStartLearning() {
    const id = addPassage(title, text, "long")
    navigate("passage", { passageId: id })
  }

  if (previewChunks) {
    return (
      <Layout>
        <div className="screen-header">
          <button className="screen-header__back btn" onClick={() => setPreviewChunks(null)}>←</button>
          <span className="screen-header__title">Preview Sections</span>
        </div>
        <ChunkPreview
          chunks={previewChunks}
          onStart={handleStartLearning}
          onReSplit={handleReSplit}
        />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="screen-header">
        <button className="screen-header__back btn" onClick={back}>←</button>
        <span className="screen-header__title">New Passage</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
        <div className="form-group">
          <label className="form-label" htmlFor="passage-title">Title (optional)</label>
          <input
            id="passage-title"
            className="form-input"
            type="text"
            placeholder="e.g. Gettysburg Address"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="passage-text">Passage</label>
          <textarea
            id="passage-text"
            className="form-input form-textarea"
            placeholder="Paste or type your passage here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mode</label>
          <div className="mode-options">
            <label className="mode-option">
              <input
                type="radio"
                name="mode"
                value="quick"
                checked={mode === "quick"}
                onChange={() => setMode("quick")}
              />
              <div className="mode-option__card">
                <div className="mode-option__title">Quick</div>
                <div className="mode-option__desc">
                  One passage, 5-game sequence. Best for short texts.
                </div>
              </div>
            </label>
            <label className="mode-option">
              <input
                type="radio"
                name="mode"
                value="long"
                checked={mode === "long"}
                onChange={() => setMode("long")}
              />
              <div className="mode-option__card">
                <div className="mode-option__title">Long</div>
                <div className="mode-option__desc">
                  Auto-splits into sections. For speeches, chapters.
                </div>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
          {mode === "long" ? "Preview Sections →" : "Start Learning →"}
        </button>
      </form>
    </Layout>
  )
}
