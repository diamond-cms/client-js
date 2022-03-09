import fetch from 'isomorphic-fetch'

const DIAMOND_HOST = 'https://app.diam.io'

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

export function login(appId, callback, host = DIAMOND_HOST) {
  const top = (screen.height - LOGIN_WINDOW_HEIGHT) / 2
  const left = (screen.width - LOGIN_WINDOW_WIDTH) / 2
  window.open(
    `${host}/api/login/${appId}`,
    'login',
    `${LOGIN_WINDOW_SETTINGS},top=${top},left=${left}`,
  )
  window.addEventListener(
    'message',
    async (event) => {
      const { isTrusted, origin, data: token } = event
      if (origin === host && isTrusted) {
        try {
          callback(token)
        } catch (e) {}
      }
    },
    false,
  )
}

export async function query(token, gql, host = DIAMOND_HOST) {
  const response = await fetch(`${host}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authentication: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(gql),
  })
  return response.json()
}

export function getCookieServer(req, name) {
  if (req && req.cookies) {
    return req.cookies[name]
  }
}

export function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
}

export function setCookie(name, token) {
  document.cookie = `${name}=${token}; Path=/; SameSite=Lax; Secure`
}
