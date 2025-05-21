import { useState } from 'react'
import { clearToken, getToken, setToken } from './lib/auth'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'

export function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()))

  return (
    authenticated ? (
      <Dashboard
        onLogout={() => {
          clearToken()
          setAuthenticated(false)
        }}
      />
    ) : (
      <LoginPage
        onAuthenticated={(token) => {
          setToken(token)
          setAuthenticated(true)
        }}
      />
    )
  )
}
