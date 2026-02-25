import { createContext, useContext } from "react"

export const NavigationContext = createContext(null)

export function useNav() {
  return useContext(NavigationContext)
}
