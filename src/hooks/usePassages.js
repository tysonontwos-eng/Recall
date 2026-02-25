import { useState, useCallback } from "react"
import { getPassages, setPassages, setPassageState, deletePassageState } from "../utils/storage.js"
import { initQuickState, initLongState, buildMeta } from "../utils/progress.js"
import { splitPassage } from "../utils/splitter.js"

export function usePassages() {
  const [passages, setPassagesState] = useState(() => getPassages())

  const addPassage = useCallback((title, text, mode) => {
    const id = crypto.randomUUID()
    let passageState

    if (mode === "quick") {
      passageState = initQuickState(id, text)
    } else {
      const chunks = splitPassage(text)
      passageState = initLongState(id, text, chunks)
    }

    setPassageState(id, passageState)

    const meta = buildMeta(passageState, {
      title: title.trim() || text.slice(0, 60).trim(),
      createdAt: Date.now(),
    })

    const updated = [meta, ...passages]
    setPassages(updated)
    setPassagesState(updated)

    return id
  }, [passages])

  const deletePassage = useCallback((id) => {
    deletePassageState(id)
    const updated = passages.filter((p) => p.id !== id)
    setPassages(updated)
    setPassagesState(updated)
  }, [passages])

  const refreshPassage = useCallback((meta) => {
    const updated = passages.map((p) => (p.id === meta.id ? { ...p, ...meta } : p))
    setPassages(updated)
    setPassagesState(updated)
  }, [passages])

  return { passages, addPassage, deletePassage, refreshPassage }
}
