import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { clearToken, getToken, setToken } from './lib/auth'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'

export function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()))

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1649d8',
          colorInfo: '#1649d8',
          colorSuccess: '#18785b',
          colorWarning: '#c57b09',
          colorError: '#c43c35',
          colorText: '#14213d',
          colorBgBase: '#f2f0e9',
          fontFamily: '"Fira Sans", sans-serif',
          borderRadius: 4,
          controlHeight: 40,
        },
      }}
    >
      {authenticated ? (
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
      )}
    </ConfigProvider>
  )
}
