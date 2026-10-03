import { useEffect, useRef, useState } from 'react'
import pkg from '../package.json'
import {
  applyPwaUpdate,
  checkPwaUpdate,
  getPwaState,
  requestPwaInstall,
  subscribePwa,
} from './pwaManager'
import {
  exportLocalBackup,
  formatBytes,
  getStorageEstimate,
  importLocalBackup,
} from './backupService'

export default function PwaInstall() {
  const backupInput = useRef(null)
  const [pwa, setPwa] = useState(getPwaState())
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(false)
  const [storage, setStorage] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const unsubscribe = subscribePwa(setPwa)
    refreshStorage()

    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      unsubscribe()
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  async function install() {
    const result = await requestPwaInstall()

    if (result.outcome === 'accepted') {
      setMessage('安裝中…')
    } else if (result.outcome === 'ios-manual') {
      setMessage('iPhone：點 Safari 分享按鈕 →「加入主畫面」。')
    } else if (result.outcome === 'manual') {
      setMessage('請從瀏覽器選單選「安裝應用程式／加入主畫面」。')
    }
  }

  async function checkUpdate() {
    setChecking(true)
    setMessage('正在檢查更新…')

    try {
      const result = await checkPwaUpdate()
      if (!result.supported) {
        setMessage('這個瀏覽器不支援 PWA 更新檢查。')
      } else if (result.needsRefresh) {
        setMessage('找到新版本，可以立即更新。')
      } else {
        setMessage('已完成更新檢查。若有新版，會顯示「立即更新」。')
      }
    } catch {
      setMessage('更新檢查失敗，請確認網路後再試一次。')
    } finally {
      setChecking(false)
    }
  }

  async function restoreBackup(file) {
    if (!file) return
    const confirmed = window.confirm('匯入備份會取代目前這台裝置上的周到資料，確定繼續？')
    if (!confirmed) return

    try {
      await importLocalBackup(file)
      window.location.reload()
    } catch (error) {
      setMessage(error.message || '備份匯入失敗。')
    }
  }

  async function refreshStorage() {
    setStorage(await getStorageEstimate())
  }

  return <details className="settings-card setting-accordion">
    <summary>
      <div>
        <strong>PWA 與資料</strong>
        <p>安裝、更新、離線狀態與本機備份。</p>
      </div>
      <span className="accordion-chevron">⌄</span>
    </summary>

    <div className="accordion-body pwa-install-panel">
      <div className="pwa-status-grid">
        <div><span>版本</span><strong>v{pkg.version}</strong></div>
        <div><span>連線</span><strong>{online ? '在線' : '離線模式'}</strong></div>
        <div><span>安裝</span><strong>{pwa.installed ? '已安裝' : '尚未安裝'}</strong></div>
        <div>
          <span>本機空間</span>
          <strong>{storage ? formatBytes(storage.usage) : '讀取中…'}</strong>
        </div>
      </div>

      {!pwa.installed && <button className="primary full" onClick={install}>
        安裝 PWA
      </button>}

      <div className="pwa-action-grid">
        <button className="secondary" onClick={checkUpdate} disabled={checking}>
          {checking ? '檢查中…' : '檢查更新'}
        </button>
        {pwa.needsRefresh
          ? <button className="primary" onClick={applyPwaUpdate}>立即更新</button>
          : <button className="secondary" onClick={() => window.location.reload()}>重新載入</button>}
      </div>

      <div className="pwa-action-grid">
        <button className="secondary" onClick={exportLocalBackup}>匯出備份</button>
        <button className="secondary" onClick={() => backupInput.current?.click()}>匯入備份</button>
      </div>

      <input
        ref={backupInput}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={event => restoreBackup(event.target.files?.[0])}
      />

      {message && <p className="pwa-install-message">{message}</p>}
    </div>
  </details>
}
