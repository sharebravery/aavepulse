import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/fira-sans/400.css'
import '@fontsource/fira-sans/500.css'
import '@fontsource/fira-sans/600.css'
import '@fontsource/fira-code/500.css'
import '@fontsource/fira-code/600.css'
import 'antd/dist/reset.css'
import './styles.css'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
