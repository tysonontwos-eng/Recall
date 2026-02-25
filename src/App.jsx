import { useState, useCallback, useMemo } from "react"
import { NavigationContext } from "./router/NavigationContext.js"
import Router from "./router/Router.jsx"

export default function App() {
  const [history, setHistory] = useState([{ screen: "home", params: {} }])

  const navigate = useCallback((screen, params = {}) => {
    setHistory((h) => [...h, { screen, params }])
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
    window.scrollTo(0, 0)
  }, [])

  const replace = useCallback((screen, params = {}) => {
    setHistory((h) => [...h.slice(0, -1), { screen, params }])
    window.scrollTo(0, 0)
  }, [])

  const current = history[history.length - 1]

  const nav = useMemo(
    () => ({ navigate, back, replace, screen: current.screen, params: current.params }),
    [navigate, back, replace, current.screen, current.params]
  )

  return (
    <NavigationContext.Provider value={nav}>
      <Router />
    </NavigationContext.Provider>
  )
}
