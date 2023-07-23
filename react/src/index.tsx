import { createContext, useContext } from 'react'
import { Diamond } from '@diam/js'


type ContextValue = {
  client?: Diamond,
  login: () => void,
  logout: () => void,
}
const NOOP = () => {}
const userValue: ContextValue = { login: NOOP, logout: NOOP }
const UserContext = createContext<ContextValue>(userValue)
export function DiamondProvider() {
  return (
    <h1>Ba</h1>
  )
}

export function useUser() {
  return useContext(UserContext)
}

export const Provider = UserContext.Provider
