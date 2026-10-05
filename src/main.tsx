import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onRegisteredSW(_workerUrl, registration) {
    if (!registration) return

    let checking = false
    const checkForUpdate = async () => {
      if (checking || !navigator.onLine || document.visibilityState !== 'visible') return
      checking = true
      try { await registration.update() }
      catch { /* Try again when the app regains focus or at the next interval. */ }
      finally { checking = false }
    }

    document.addEventListener('visibilitychange', checkForUpdate)
    window.addEventListener('focus', checkForUpdate)
    window.addEventListener('online', checkForUpdate)
    window.setInterval(checkForUpdate, 15 * 60 * 1000)
  },
})
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
