import { useEffect, useMemo, useCallback, useState } from 'react'
import Diamond from '@diam/js'

const APP_ID = 'app_changeme'
const EXAMPLE_GQL_QUERY = `query {
  Places { items { id, name } }
}`
const diam = Diamond({
  appId: APP_ID,
  cookieName: 'example-cookie',
})

function useDiamond(initToken) {
  const [loading, setLoading] = useState(!initToken)
  const [token, setToken] = useState(initToken)
  const user = useMemo(() => {
    return diam.user(token)
  }, [token])
  const login = useCallback(() => {
    diam.login(setToken)
  }, [])
  const logout = useCallback(() => {
    setToken('')
    diam.logout()
  }, [])
  useEffect(() => {
    if (!initToken) {
      const token = diam.getCookie()
      if (token) {
        setToken(token)
      }
      setLoading(false)
    }
  }, [])
  return [user, login, logout, loading]
}

export default function HomePage({ initToken, initResult }) {
  const [user, login, logout, loading] = useDiamond(initToken)
  const onLogin = useCallback((e) => {
    e.preventDefault()
    login()
  }, [login])
  const [result, setResult] = useState(initResult)
  const onFetch = useCallback(async () => {
    const result = await user.query({
      query: EXAMPLE_GQL_QUERY,
    })
    setResult(result)
  }, [user])
  useEffect(() => {
    if (!initResult && !loading) {
      onFetch()
    }
  }, [onFetch, loading])
  return (
    <>
      <h1>Diamond Example App</h1>
      {!user.token ? (
        <a href="" onClick={onLogin}>Login</a>
      ) : (
        <a href="" onClick={logout}>Logout</a>
      )}
      <h3>Logged In as: {user.token}</h3>
      <a href="#" onClick={onFetch}>Fetch</a>
      {result && result.data && result.data.Places.items && (
        <ol>
          {result.data.Places.items.map(({ id, name }) => {
            return <li key={id}>{name}</li>
          })}
        </ol>)}
    </>
  )
}

export async function getServerSideProps({ req }) {
  // Example of server side fetching
  const initToken = diam.getCookieServer(req)
  if (initToken) {
    const user = diam.user(initToken)
    const initResult = await user.query({
      query: EXAMPLE_GQL_QUERY,
    })
    return { props: { initToken, initResult } }
  }
  return { props: {} }
}
