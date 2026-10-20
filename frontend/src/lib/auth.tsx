import React, { useSyncExternalStore } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Center, Spinner } from '@chakra-ui/react'
import { getAuthSnapshot, subscribeAuth, type AuthSnapshot } from './api'

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot)
}

// Wrap a page to require sign-in: waits for the first session check, then redirects to /login.
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) {
    return (
      <Center minH="50vh">
        <Spinner color="brand.500" />
      </Center>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <>{children}</>
}
