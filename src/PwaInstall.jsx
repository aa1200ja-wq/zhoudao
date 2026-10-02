import { useEffect, useState } from 'react'

export default function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [message, setMessage] = useState('')

  useEffect(() => {
    function onBeforeInstall(event) {
      event.preventDefault()
      setPromptEvent(event)
    }

    function onInstalled() {
      setInstalled(true)
      setPromptEvent(null)
      setMessage('已安裝到裝置。')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (installed) return

    if (promptEvent) {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') {
        setMessage('安裝中…')
      }
      setPromptEvent(null)
      return
    }

    if (isIos()) {
      setMessage('iPhone：點 Safari 分享按鈕 →「加入主畫面」。')
      return
    }

    setMessage('若瀏覽器未跳出安裝視窗，請從瀏覽器選單選「安裝應用程式／加入主畫面」。')
  }

  return <details className="settings-card setting-accordion">
    <summary>
      <div>
        <strong>PWA 安裝</strong>
        <p>把周到放到手機主畫面，像 App 一樣開啟。</p>
      </div>
      <span className="accordion-chevron">⌄</span>
    </summary>

    <div className="accordion-body pwa-install-panel">
      <button
        className="primary full pwa-install-button"
        onClick={install}
        disabled={installed}
      >
        {installed ? '已安裝 PWA' : '安裝 PWA'}
      </button>
      {message && <p className="pwa-install-message">{message}</p>}
    </div>
  </details>
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}
