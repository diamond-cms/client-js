import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Diamond, DiamondOptions } from '@diam/js'


type DiamondReactContext = {
  client?: Diamond
  session?: any
  setSession?: DiamondSessionStore
}
const diamondContext = createContext<DiamondReactContext>({})
const Provider = diamondContext.Provider

const LOGIN_WINDOW_ID = 'diam_login'
const LOGIN_WINDOW_HEIGHT = 700
const LOGIN_WINDOW_WIDTH = 500
const LOGIN_WINDOW_SETTINGS = [
  'toolbar=no',
  'location=yes',
  'directories=no',
  'status=no',
  'menubar=no',
  'copyhistory=no',
  'scrollbars=yes',
  'resizable=yes',
  `height=${LOGIN_WINDOW_HEIGHT}`,
  `width=${LOGIN_WINDOW_WIDTH}`,
].join(',')

export type DiamondReactOptions = DiamondOptions & { cookie: string }
type GetSessionFn = (diamond: Diamond, sessionData: any) => any
type AppProps = {
  options: DiamondReactOptions,
  getSession?: GetSessionFn,
  children: ReactNode,
}

export function DiamondApp({ options, getSession, children }: AppProps) {
  const { cookie } = options
  const [sessionData, setSession] = useCookieStore(cookie)
  const client = useMemo<Diamond>(() => {
    return new Diamond<typeof getSession extends GetSessionFn ? ReturnType<typeof getSession> : any>({
      ...options,
      accessToken: sessionData ? sessionData.id : undefined,
    })
  }, [options, getSession, sessionData])
  const session = useMemo(() => {
    if (getSession) {
      return getSession(client, sessionData ? sessionData.data : undefined)
    }
  }, [client])
  return (
    <Provider value={{ client, session, setSession }}>{children}</Provider>
  )
}

export function useDiamond() {
  return useContext(diamondContext).client
}

export function useDiamondSession() {
  return useContext(diamondContext).session
}

export function useDiamondLogout() {
  const { setSession } = useContext(diamondContext)
  return useCallback(() => {
    setSession && setSession(null, -1)
  }, [setSession])
}

export function useDiamondLogin() {
  const { client, setSession } = useContext(diamondContext)
  return useCallback(() => {
    if (!client) {
      throw new Error('missing_diamond_client')
    }
    const { apiUrl, apiOrigin } = client
    const top = (screen.height - LOGIN_WINDOW_HEIGHT) / 2
    const left = (screen.width - LOGIN_WINDOW_WIDTH) / 2
    const loginUrl = `${apiUrl}/auth/login`
    const windowSettings = `${LOGIN_WINDOW_SETTINGS},top=${top},left=${left}`
    window.open(loginUrl, LOGIN_WINDOW_ID, windowSettings)
    window.addEventListener('message', async (event) => {
      const { isTrusted, origin, data } = event
      if (origin === apiOrigin && isTrusted) {
        const { sessionData, expirySecs } = JSON.parse(data)
        try {
          if (sessionData) {
            client.setToken(sessionData.id)
            if (setSession) {
              setSession(sessionData, expirySecs)
            }
          }
        } catch (e) {
          console.log('WARN! Callback error:', e)
        }
      }
    }, {
      once: true,
      capture: false
    })
  }, [client, setSession])
}

type DiamondSessionData = {
  id: string,
  data: any,
} | null | undefined
type DiamondSessionStore = (sessionData: DiamondSessionData, expirySecs: number) => void
function saveSessionCookie(cookieName: string | undefined, sessionData: DiamondSessionData, expirySecs: number = 0): void {
  if (!cookieName) return;
  let cookieStr
  if (sessionData) {
    const sessionDataString = JSON.stringify(sessionData)
    cookieStr = `${cookieName}=${encodeURIComponent(sessionDataString)}; Path=/; SameSite=Lax; Max-Age=${expirySecs}; Secure`
  } else {
    cookieStr = `${cookieName}=; Path=/; SameSite=Lax; Max-Age=${expirySecs}; Secure`
  }
  document.cookie = cookieStr
}
function getCookie(searchName: string | undefined) {
  if (!searchName) return ''
  const search = document.cookie.split(';')
    .map((cookieString: string): string[] => cookieString.trim().split('='))
    .filter(([name]: string[]) => (name === searchName))[0]
  return (search && search[1]) || ''
}
function getSessionData(cookieName: string | undefined): DiamondSessionData {
  const sessionDataString = getCookie(cookieName)
  if (sessionDataString) {
    return JSON.parse(decodeURIComponent(sessionDataString))
  }
}
export function useCookieStore(cookieName: string | undefined): [DiamondSessionData, DiamondSessionStore] {
  const [sessionData, setSessionData] = useState(getSessionData(cookieName))
  return [sessionData, (newSessionData: DiamondSessionData, expirySecs: number) => {
    saveSessionCookie(cookieName, newSessionData, expirySecs)
    setSessionData(newSessionData)
  }]
}
