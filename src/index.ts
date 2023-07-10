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
  Authorization?: string,
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
export type LoginCallback = () => void
export class DiamondAPI {
}

export type DiamondOptions = Partial<{
  projectId: string,
  appId: string,
  host: string,
  isLocal: boolean,
  sessionStore: DiamondSessionStore,
  sessionData: DiamondSessionData,
}>

const DEFAULT_API_HOST = 'diam.io'
export class Diamond {
  appId: string
  projectId: string
  apiOrigin: string
  apiUrl: string

  headers: QueryHeaders
  sessionData: any
  sessionStore: DiamondSessionStore | undefined
  async query(endpoint: string, method: string = 'POST', body = {}, otherOpts: object = {}) {
    const { headers, apiUrl } = this
    try {
      const fetchParams: FetchParams = { ...otherOpts, method, headers }
      const isGet: boolean = (method.toLowerCase() === 'get')
      if (!isGet) {
        fetchParams.body = JSON.stringify(body)
      }
      const url = `${apiUrl}${endpoint}${isGet ? `?${new URLSearchParams(body)}` : ''}`
      // console.log(fetchParams, isGet, url, fetchParams)
      const response = await fetch(url, fetchParams)
      return response.json()
    } catch (cause) {
      throw new Error(`diam q: ${body} err: ${cause?.message}`)
    }
  }

  constructor(options: DiamondOptions = {}) {
    const {
      projectId, appId,
      isLocal = false,
      sessionStore,
      sessionData,
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
    this.headers = {
      'Content-Type': 'application/json',
    }
    if (sessionData) {
      this.headers.Authorization = `Bearer ${sessionData.id}`
      this.sessionData = sessionData.data
    }
    if (sessionStore) {
      this.sessionStore = sessionStore
    }
  }
  login(callback: LoginCallback): void {
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
          if (sessionData) {
            if (this.sessionStore) {
              this.sessionStore(sessionData, expirySecs)
            }
            callback()
          }
        } catch (e) {
          console.log('WARN! Callback error:', e)
        }
      }
    }, false)
  }
}
