import fetch from 'isomorphic-fetch'

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

type QueryHeaders = {
  'Content-Type': string,
  Authentication: string,
}
type FetchParams = {
  method: string,
  headers: QueryHeaders,
  body?: string,
}
export type DiamondSessionData = {
  id: string,
  data: any,
}
export type DiamondSessionStore = (sessionData: DiamondSessionData, expirySecs: number) => void
export class DiamondAPI {
  headers: QueryHeaders
  queryUrl: string
  sessionData: any
  sessionStore: DiamondSessionStore
  constructor(queryUrl: string, session: DiamondSessionData, sessionStore: DiamondSessionStore) {
    this.headers = {
      'Content-Type': 'application/json',
      Authentication: `Bearer ${session.id}`,
    }
    this.queryUrl = queryUrl
    this.sessionData = session.data
    this.sessionStore = sessionStore
  }
  async query(endpoint: string, method: string = 'POST', body = {}) {
    const { headers, queryUrl } = this
    try {
      const fetchParams: FetchParams = { method, headers }
      const isGet: boolean = (method.toLowerCase() === 'get')
      if (!isGet) {
        fetchParams.body = JSON.stringify(body)
      }
      const response = await fetch(`${queryUrl}${endpoint}${isGet ? new URLSearchParams(body) : ''}`, fetchParams)
      return response.json()
    } catch (cause) {
      throw new Error(`diam q: ${body} err: ${cause?.message}`)
    }
  }
}

export type DiamondOptions = Partial<{
  projectId: string,
  appId: string,
  host: string,
  isLocal: boolean,
}>

const DEFAULT_API_HOST = 'diam.io'
export class Diamond {
  appId: string
  projectId: string
  apiOrigin: string
  apiUrl: string
  constructor(options: DiamondOptions = {}) {
    const {
      projectId, appId,
      isLocal = false,
    } = options
    if (!projectId && !isLocal) {
      throw new Error('Diamond: Missing projectId')
    }
    if (!appId) {
      throw new Error('Diamond: Missing appId')
    }
    this.appId = appId
    this.projectId = projectId || 'localhost'
    const apiHost = options.host || (isLocal ? 'localhost' : DEFAULT_API_HOST)
    this.apiOrigin = isLocal ? `http://${apiHost}` : `https://${projectId}.${apiHost}`
    this.apiUrl = `${this.apiOrigin}/api/${appId}`
  }
  login(callback: DiamondSessionStore): void {
    const { apiUrl, apiOrigin } = this
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
          if (callback) {
            callback(sessionData, expirySecs)
          }
        } catch (e) {
          console.log('WARN! Callback error:', e)
        }
      }
    }, false)
  }
  api(sessionData: DiamondSessionData, sessionStore: DiamondSessionStore): DiamondAPI {
    return new DiamondAPI(this.apiUrl, sessionData, sessionStore)
  }
}

export default Diamond
