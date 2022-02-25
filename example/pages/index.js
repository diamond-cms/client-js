import Router from 'next/router'
import { useEffect, useCallback, useState } from 'react'
import { login, query, getCookieServer, getCookie, setCookie } from '@diam/js'

const COOKIE_NAME = 'example-cookie'
const DIAMOND_PROJECT = 'leander-co'

export default function HomePage({ initResult }) {
  const [user, setUser] = useState(null)
  const [result, setResult] = useState(initResult)
  const [token, setToken] = useState('')
  const onLogin = useCallback(() => {
    login((token, user) => {
      setCookie(COOKIE_NAME, token)
      setToken(token)
      setUser(user)
    })
  }, [])
  useEffect(() => {
    setToken(getCookie(COOKIE_NAME))
  }, [])
  const onLogout = useCallback(() => setToken(''))
  const onFetch = useCallback(async () => {
    const result = await query(token, DIAMOND_PROJECT, {
      query: `query { Places { items { id, name, country } } }`,
    })
    setResult(result)
  }, [token])
  return (
    <>
      <h1>Diamond Example App</h1>
      {!token ? (
        <a href="#" onClick={onLogin}>Login</a>
      ) : (
        <>
          <a href="#" onClick={onLogout}>Logout</a>
          <h3>Logged In as: {token}</h3>
          <a href="#" onClick={onFetch}>Fetch</a>
          {result && result.data && result.data.Places.items && (
            <ol>
              {result.data.Places.items.map(({ id, name, country }) => {
                return <li key={id}>{name}, {country}</li>
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
    const initResult = await query(token, DIAMOND_PROJECT, {
      query: `query { Places { items { id, name, country } } }`,
    })
    return { props: { initResult } }
  }
  return { props: {} }
}
