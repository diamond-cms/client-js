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
export class DiamondUser {
  headers: QueryHeaders
  queryUrl: string
  constructor(queryUrl: string, sessionId: string) {
    this.headers = {
      'Content-Type': 'application/json',
      Authentication: `Bearer ${sessionId}`,
    }
    this.queryUrl = queryUrl
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

export type DiamondOptions = {
  projectId: string,
  appId: string,
  host: string,
  isLocal: boolean,
  cookieName: string,
}

const DEFAULT_API_HOST = 'diam.io'
const DEFAULT_COOKIE_NAME = 'session'
export class Diamond {
  appId: string
  projectId: string
  apiOrigin: string
  apiUrl: string
  cookieName: string
  constructor(options: Partial<DiamondOptions> = {}) {
    const {
      projectId, appId,
      isLocal = false,
      cookieName = DEFAULT_COOKIE_NAME,
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
    this.cookieName = cookieName
  }
  login(callback) {
    const { apiUrl, apiOrigin, cookieName } = this
    const top = (screen.height - LOGIN_WINDOW_HEIGHT) / 2
    const left = (screen.width - LOGIN_WINDOW_WIDTH) / 2
    const loginUrl = `${apiUrl}/auth/login`
    const windowSettings = `${LOGIN_WINDOW_SETTINGS},top=${top},left=${left}`
    window.open(loginUrl, LOGIN_WINDOW_ID, windowSettings)
    window.addEventListener('message', async (event) => {
      const { isTrusted, origin, data } = event
      if (origin === apiOrigin && isTrusted) {
        const { sessionId, expirySecs } = JSON.parse(data)
        if (cookieName) {
          this.setCookie(sessionId, expirySecs)
        }
        try {
          if (callback) {
            const user = this.user(sessionId)
            callback(user)
          }
        } catch (e) {
          console.log('WARN! Callback error:', e)
        }
      }
    }, false)
  }
  user(sessionId) {
    return new DiamondUser(this.apiUrl, sessionId)
  }
  logout() {
    this.setCookie('', 0)
  }
  getCookieServer(req) {
    const { cookieName } = this
    if (req && req.cookies) {
      return req.cookies[cookieName]
    }
  }
  getCookie() {
    const { cookieName } = this
    const value = `; ${document.cookie}`
    const parts: string[] = value.split(`; ${cookieName}=`)
    if (parts.length === 2) {
      return (parts.pop() || '').split(';').shift()
    }
    return ''
  }
  setCookie(token, expirySecs) {
    const { cookieName } = this
    // TODO: set expiry
    const cookieStr = `${cookieName}=${token}; Path=/; SameSite=Lax; Max-Age=${expirySecs}; Secure`
    document.cookie = cookieStr
  }
}

export default Diamond
