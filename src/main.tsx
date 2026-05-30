import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/animations.css'
import App from './app/App'

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK_API !== 'true') {
    return
  }
  const { worker } = await import('./mocks/browser')
  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    onUnhandledRequest: 'bypass', // Don't warn on unmocked requests
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
