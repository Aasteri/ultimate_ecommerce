import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './layouts.css'
import './layouts-chrome.css'
import './layouts-season-fx.css'
import './home-structures.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
