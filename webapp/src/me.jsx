import { createContext, useContext } from 'react'
import { useApi } from './api.js'

const MeContext = createContext(null)

// Current user from /api/me, shared by every screen.
export function MeProvider({ children }) {
  const me = useApi('/api/me')
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>
}

export const useMe = () => useContext(MeContext)
