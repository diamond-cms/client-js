import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Diamond, DiamondOptions, DiamondSessionData, DiamondSessionStore } from '@diam/js'


type ContextValue = {
  client?: Diamond,
  login: () => void,
  logout: () => void,
}
const NOOP = () => {}
const userValue: ContextValue = { login: NOOP, logout: NOOP }
const UserContext = createContext<ContextValue>(userValue)
const Provider = UserContext.Provider

type AppProps = {
  options: DiamondOptions,
  session?: DiamondSessionData,
  saveSession?: DiamondSessionStore,
  children: ReactNode,
}
export function DiamondApp({ options, session, saveSession, children }: AppProps) {
  const [client, setClient] = useState<Diamond>(new Diamond({
    ...options,
    sessionStore: saveSession,
    sessionData: session,
  }))
  return (
    <Provider value={{
      client,
      login: () => {
        client.login(() => {
          console.log('called')
          setClient(new Diamond({
            ...options,
            sessionStore: saveSession,
            sessionData: session,
          }))
        })
      },
      logout: () => {
        client.logout()
        setClient(new Diamond({
          ...options,
          sessionData: null,
          sessionStore: saveSession,
        }))
      },
    }}>{children}</Provider>
  )
}

export function useDiamond() {
  return useContext(UserContext)
}


// export function useInitUser(diamOpts: DiamondOptions, sessionData: DiamondSessionData | undefined): ContextValue {
//   const client = new Diamond({
//     ...diamOpts,
//     sessionStore(newSessionData: DiamondSessionData, newExpirySecs: number = 0) {
//       const newSessionString = JSON.stringify(newSessionData)
//       saveSessionCookie(newSessionString, newExpirySecs)
//       window.location.reload()
//     },
//     sessionData
//   })
//   const user = new User(diamond)
//   function login() {
//     diamond.login()
//   }
//   function logout() {
//     saveSessionCookie('')
//     window.location.reload()
//   }
//   userValue.client = client
//   userValue.login = login
//   userValue.logout = logout
//   return userValue
// }
