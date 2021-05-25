import { useEffect, useMemo, useContext, useState, createContext } from 'react'
import API from './api'

const refs = { uuid: 1, diamond: undefined }
const context = createContext(refs)

export function useDiamondUser(initUser) {
  const [user, setUser] = useState(initUser)
  const { diamond } = useContext(context)
  const id = useMemo(() => refs.uuid++, [])
  useEffect(() => {
    diamond.listenUserChange(id, setUser)
    return () => {
      diamond.unlistenUserChange(id)
    }
  }, [diamond])
  return user
}

export function useDiamondConfig(config) {
  return useMemo(() => {
    const diamond = new API(config)
    refs.diamond = diamond
    return diamond
  }, [config])
}

export function useDiamond() {
  const { diamond } = useContext(context)
  return diamond
}
