import fetch from 'isomorphic-fetch'

const DIAMOND_HOST = 'https://app.diam.io'

export function login(callback, host = DIAMOND_HOST) {
  const height = 700
  const width = 500
  const top = (screen.height - height) / 2
  const left = (screen.width - width) / 2
  const loginWindow = window.open(`${host}/api/settings/login`, 'login', [
    'toolbar=no',
    'location=yes',
    'directories=no',
    'status=no',
    'menubar=no',
    'copyhistory=no',
    'scrollbars=yes',
    'resizable=yes',
    `height=${height}`,
    `width=${width}`,
    `top=${top}`,
    `left=${left}`,
  ].join(','))
  window.addEventListener('message', async (event) => {
    const { isTrusted, origin, data } = event
    if (origin === host && isTrusted) {
      try {
        const { token, user } = JSON.parse(data)
        callback(token, user)
      } catch (e) {}
    }
  }, false)
}

export async function query(token, project, gql, host = DIAMOND_HOST) {
  const response = await fetch(`${host}/api/${project}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authentication': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(gql),
  })
  return response.json()
}
