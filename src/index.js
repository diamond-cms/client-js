import fetch from 'isomorphic-fetch'

const DIAMOND_HOST = 'https://app.diam.io'

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

class DiamondUser {
  constructor(api, token) {
    const { appId, host } = api
    let queryUrl = `${host}/api/graphql`
    if (!token) {
      queryUrl = `${queryUrl}/${appId}`
    }
    this.token = token
    this.queryUrl = queryUrl
  }
  async query(gql) {
    if (!gql.query) {
      throw new Error('diamond-query-missing-query')
    }
    const { token, queryUrl } = this
    try {
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authentication: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(gql),
      })
      return response.json()
    } catch (cause) {
      throw new Error(`diam q: ${gql.query} err: ${cause.message}`, { cause })
    }
  }
}

class Diamond {
  constructor(options = {}) {
    const {
      appId,
      host = DIAMOND_HOST,
      cookieName = '',
    } = options
    if (!appId) {
      throw new Error('diamond-missing-appId')
    }
    this.appId = appId
    this.host = host
    this.cookieName = cookieName
  }
  login(callback) {
    const { appId, host, cookieName } = this
    const top = (screen.height - LOGIN_WINDOW_HEIGHT) / 2
    const left = (screen.width - LOGIN_WINDOW_WIDTH) / 2
    const loginUrl = `${host}/api/login/${appId}`
    const windowSettings = `${LOGIN_WINDOW_SETTINGS},top=${top},left=${left}`
    window.open(loginUrl, LOGIN_WINDOW_ID, windowSettings)
    window.addEventListener('message', async (event) => {
      const { isTrusted, origin, data: token } = event
      if (origin === host && isTrusted) {
        if (cookieName) {
          this.setCookie(token)
        }
        try {
          if (callback) {
            callback(token)
          }
        } catch (e) {
          console.log('WARN! Callback error:', e)
        }
      }
    }, false)
  }
  user(token) {
    return new DiamondUser(this, token)
  }
  logout() {
    this.setCookie('')
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
    const parts = value.split(`; ${cookieName}=`)
    if (parts.length === 2) {
      return parts.pop().split(';').shift()
    }
    return ''
  }
  setCookie(token) {
    const { cookieName } = this
    document.cookie = `${cookieName}=${token}; Path=/; SameSite=Lax; Secure`
  }
}

export default function DiamondAPI(options) {
  return new Diamond(options)
}
