import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from '@/App'
import '@/index.css'

document.documentElement.dataset.theme = 'dark'

try {
  registerSW({ immediate: true })
} catch (error) {
  console.warn('[AAHAAR] service worker registration skipped', error)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
