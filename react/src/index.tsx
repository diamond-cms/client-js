import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Diamond, DiamondOptions, DiamondSessionData, DiamondSessionStore } from '@diam/js'

const UserContext = createContext<Diamond | undefined>(undefined)
const Provider = UserContext.Provider

type DiamondReactSessionStore = [DiamondSessionData | undefined, DiamondSessionStore]
type AppProps = {
  options: DiamondOptions,
  sessionStore: DiamondReactSessionStore,
  children: ReactNode,
}
export function DiamondApp({ options, sessionStore, children }: AppProps) {
  const client = useMemo<Diamond>(() => {
    return new Diamond({
      ...options,
      sessionStore: sessionStore[1],
      sessionData: sessionStore[0],
    })
  }, [options, sessionStore])
  return (
    <Provider value={client}>{children}</Provider>
  )
}

export function useDiamond() {
  return useContext(UserContext)
}

export function useDiamondValue(resourceId: string, defaultValue: any): any {
  const client = useDiamond()
  const [value, setValue] = useState(defaultValue)
  useEffect(() => {
    function updateValue(newValue: any) {
      if (newValue) {
        setValue(newValue)
      }
    }
    let unsubscribe: () => void
    (async () => {
      unsubscribe = await client?.getValue(resourceId, { sub: updateValue })
    })()
    return () => {
      unsubscribe && unsubscribe()
    }
  }, [client])
  return value
}


function saveSessionCookie(cookieName: string, sessionData: DiamondSessionData | undefined, expirySecs: number = 0): void {
  let cookieStr
  if (sessionData) {
    const sessionDataString = JSON.stringify(sessionData)
    cookieStr = `${cookieName}=${encodeURIComponent(sessionDataString)}; Path=/; SameSite=Lax; Max-Age=${expirySecs}; Secure`
  } else {
    cookieStr = `${cookieName}=; Path=/; SameSite=Lax; Max-Age=${expirySecs}; Secure`
  }
  document.cookie = cookieStr
}
function getCookie(searchName: string) {
  const search = document.cookie.split(';')
    .map((cookieString: string): string[] => cookieString.trim().split('='))
    .filter(([name]: string[]) => (name === searchName))[0]
  return (search && search[1]) || ''
}
function getSessionData(cookieName: string): DiamondSessionData | undefined {
  const sessionDataString = getCookie(cookieName)
  if (sessionDataString) {
    return JSON.parse(decodeURIComponent(sessionDataString))
  }
}
export function useCookieStore(cookieName: string): [DiamondSessionData | undefined, DiamondSessionStore] {
  const [sessionData, setSessionData] = useState(getSessionData(cookieName))
  return [sessionData, (newSessionData: DiamondSessionData | undefined, expirySecs: number) => {
    saveSessionCookie(cookieName, newSessionData, expirySecs)
    setSessionData(newSessionData)
  }]
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
