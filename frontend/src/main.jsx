import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'

const checkForNewDeployment = async () => {
  const currentBundle = Array.from(document.scripts)
    .map((script) => script.src)
    .find((src) => src.includes('/assets/index-'))

  if (!currentBundle) return

  try {
    const response = await fetch(`/index.html?deployment-check=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!response.ok) return

    const html = await response.text()
    const latestBundle = html.match(/\/assets\/index-[^"']+\.js/)?.[0]
    const currentBundlePath = new URL(currentBundle).pathname

    if (latestBundle && latestBundle !== currentBundlePath) {
      window.location.reload()
    }
  } catch {
    // A failed check should not interrupt the running application.
  }
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <Provider store={store}>
    <App />
    </Provider>
    </BrowserRouter>
)

window.addEventListener('focus', checkForNewDeployment)
setInterval(checkForNewDeployment, 30_000)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    }).catch((error) => {
      console.error('Could not register the offline app shell:', error)
    })
  }, { once: true })
}
