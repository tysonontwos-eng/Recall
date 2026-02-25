const PASSAGES_KEY = "recall_passages"
const stateKey = (id) => `recall_state_${id}`

export function getPassages() {
  try {
    const raw = localStorage.getItem(PASSAGES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setPassages(passages) {
  try {
    localStorage.setItem(PASSAGES_KEY, JSON.stringify(passages))
  } catch (e) {
    console.error("localStorage write error (passages):", e)
  }
}

export function getPassageState(id) {
  try {
    const raw = localStorage.getItem(stateKey(id))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setPassageState(id, state) {
  try {
    localStorage.setItem(stateKey(id), JSON.stringify(state))
  } catch (e) {
    console.error("localStorage write error (state):", e)
  }
}

export function deletePassageState(id) {
  localStorage.removeItem(stateKey(id))
}
