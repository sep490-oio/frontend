import { createContext, useContext } from 'react'
import { useUserHub } from '../hooks/useUserHub'

interface UserHubContextType {
  connected: boolean
}

const UserHubContext = createContext<UserHubContextType>({ connected: false })

export function UserHubProvider({ children }: { children: React.ReactNode }) {
  const state = useUserHub()
  return <UserHubContext.Provider value={state}>{children}</UserHubContext.Provider>
}

export function useUserHubStatus() {
  return useContext(UserHubContext)
}
