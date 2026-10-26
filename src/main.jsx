import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n.js'
import { AuthProvider } from './auth.jsx'
import { SponsorProvider } from './sponsor.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><SponsorProvider><App /></SponsorProvider></AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
