import { useEffect, useState } from 'react'
import { FiDownload, FiX } from 'react-icons/fi'

function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [message, setMessage] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (standalone) setInstalled(true)

    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
      setMessage('Intervue AI is installed.')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) {
      setMessage(/iphone|ipad|ipod/i.test(navigator.userAgent)
        ? 'To install, tap Share, then Add to Home Screen.'
        : 'To install, open your browser menu and choose Install app or Add to Home Screen.')
      return
    }

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    setMessage(outcome === 'accepted' ? 'Installing Intervue AI…' : 'Installation was dismissed. You can install it from your browser menu.')
    setInstallPrompt(null)
  }

  if (installed || dismissed) return null

  return (
    <aside className="fixed bottom-4 right-4 z-[100] w-[min(22rem,calc(100vw-2rem))] rounded-xl border-2 border-black bg-white p-3 text-black shadow-[4px_4px_0_#171717]" aria-label="Install Intervue AI">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Install Intervue AI</p>
          <p className="mt-1 text-xs leading-5 text-black/70">Add the app to your device for a convenient, app-like experience.</p>
          {message && <p role="status" className="mt-2 text-xs font-bold text-sky-900">{message}</p>}
          <button type="button" onClick={install} className="mt-3 inline-flex items-center gap-2 border-2 border-black bg-yellow-300 px-3 py-2 text-xs font-extrabold shadow-[2px_2px_0_#171717] hover:bg-yellow-200">
            <FiDownload size={14} /> Install app
          </button>
        </div>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss install message" className="rounded p-1 text-black/60 hover:bg-black/5 hover:text-black">
          <FiX size={16} />
        </button>
      </div>
    </aside>
  )
}

export default PwaInstallPrompt
