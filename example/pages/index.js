import { useEffect, useCallback, useState } from 'react'
import { login, query, getCookieServer, getCookie, setCookie } from '@diam/js'

const COOKIE_NAME = 'example-cookie'
const APP_ID = 'app_example'
const EXAMPLE_GQL_QUERY = `query {
  Spots { items { id, name } }
}`

export default function HomePage({ initResult, sessionData }) {
  const [result, setResult] = useState(initResult)
  const [token, setToken] = useState('')
  const onLogin = useCallback(() => {
    login(APP_ID, (token) => {
      setCookie(COOKIE_NAME, token)
      setToken(token)
    })
  }, [])
  useEffect(() => {
    setToken(getCookie(COOKIE_NAME))
  }, [])
  useEffect(() => {
    if (token) {
      onFetch()
    }
  }, [token])
  const onLogout = useCallback(() => {
    setToken('')
    setCookie(COOKIE_NAME, '')
  })
  const onFetch = useCallback(async () => {
    const result = await query(token, {
      query: EXAMPLE_GQL_QUERY,
    })
    setResult(result)
  }, [token])
  return (
    <>
      <h1>Diamond Example App</h1>
      <pre>{JSON.stringify(sessionData)}</pre>
      {!token ? (
        <a href="#" onClick={onLogin}>Login</a>
      ) : (
        <>
          <a href="#" onClick={onLogout}>Logout</a>
          <h3>Logged In as: {token}</h3>
          <a href="#" onClick={onFetch}>Fetch</a>
          {result && result.data && result.data.Spots.items && (
            <ol>
              {result.data.Spots.items.map(({ id, name }) => {
                return <li key={id}>{name}</li>
              })}
            </ol>)}
        </>
      )}
    </>
  )
}

export async function getServerSideProps({ req }) {
  // Example of server side fetching
  const token = getCookieServer(req, COOKIE_NAME)
  if (token) {
    const sessionData = await query(token, {
      query: `
        query { session { userId, project } }
      `,
    })
    const initResult = await query(token, {
      query: EXAMPLE_GQL_QUERY,
    })
    return { props: { initResult, sessionData } }
  }
  return { props: {} }
}
