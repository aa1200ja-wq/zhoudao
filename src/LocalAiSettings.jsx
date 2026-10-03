import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Cpu,
  RefreshCw,
  Sparkles,
  Trash2,
  Unplug,
} from 'lucide-react'
import Button from './ui/Button'
import LocalAiToolbox from './LocalAiToolbox'
import {
  getAiState,
  getModelProfile,
  loadModel,
  subscribeAi,
  unloadModel,
  wasModelLoadedBefore,
} from './ai/localAiRuntime'
import {
  clearKnownModelCaches,
  getAiEnvironment,
  scanModelInventory,
} from './ai/localAiInventory'
import { testLocalAi } from './ai/localAiTasks'
import { formatBytes } from './backupService'

export default function LocalAiSettings({ preferences, onPreferenceChange }) {
  const [ai, setAi] = useState(getAiState())
  const [env, setEnv] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeAi(setAi)
    inspect()
    return unsubscribe
  }, [])

  async function inspect() {
    setBusy(true)
    setMessage('正在檢查環境與模型…')
    try {
      const [nextEnv, nextInventory] = await Promise.all([
        getAiEnvironment(),
        scanModelInventory(),
      ])
      setEnv(nextEnv)
      setInventory(nextInventory)
      setMessage('檢查完成')
    } catch (error) {
      setMessage('檢查失敗：' + (error?.message || error))
    } finally {
      setBusy(false)
    }
  }

  async function start() {
    setBusy(true)
    setMessage(wasModelLoadedBefore() ? '正在從本機啟動模型…' : '準備下載並啟動模型…')
    try {
      await loadModel()
      await inspect()
      setMessage('Qwen2.5 0.5B 已就緒')
    } catch (error) {
      setMessage('啟動失敗：' + (error?.message || error))
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    setBusy(true)
    setMessage('正在測試推論…')
    try {
      const result = await testLocalAi()
      setMessage(result || '模型有回應')
    } catch (error) {
      setMessage('測試失敗：' + (error?.message || error))
    } finally {
      setBusy(false)
    }
  }

  async function clearModel() {
    if (!window.confirm('刪除目前 PWA 可見的 Qwen 模型快取？若其他同源 PWA 共用快取，也可能需要重新載入模型；專案與圖片不會刪除。')) return
    setBusy(true)
    try {
      await unloadModel()
      const count = await clearKnownModelCaches('all')
      await inspect()
      setMessage('已清除 ' + count + ' 個模型快取檔案')
    } finally {
      setBusy(false)
    }
  }

  const profile = getModelProfile()
  const installed = inventory
    ? inventory.gpu.installed || inventory.cpu.installed
    : wasModelLoadedBefore()

  return <details className="settings-card setting-accordion local-ai-settings">
    <summary>
      <div>
        <strong>本機 AI</strong>
        <p>Qwen 模型調度、檢查與自動功能。</p>
      </div>
      <span className="accordion-chevron">⌄</span>
    </summary>

    <div className="accordion-body local-ai-body">
      <div className="local-ai-status-grid">
        <Status label="環境" value={env ? (env.webgpu ? 'WebGPU' : 'CPU/WASM') : profile.mode} />
        <Status label="模型" value={installed ? '已安裝' : '尚未安裝'} />
        <Status label="RAM" value={ai.ready ? '已載入' : '未載入'} />
        <Status label="狀態" value={ai.status === 'error' ? '異常' : ai.ready ? '正常' : '待啟動'} />
      </div>

      {ai.status === 'loading' && <div className="local-ai-progress">
        <div><i style={{ width: Math.round(ai.progress * 100) + '%' }} /></div>
        <span>{ai.message}</span>
      </div>}

      <div className="local-ai-checks">
        <Check label="WebGPU" value={env ? (env.webgpu ? '支援' : '不支援，改用 WASM') : '尚未檢查'} />
        <Check label="Web Worker" value={env ? (env.worker ? '正常' : '不支援') : '尚未檢查'} />
        <Check label="Cache Storage" value={env ? (env.cacheStorage ? '正常' : '不支援') : '尚未檢查'} />
        <Check label="網站儲存" value={env ? formatBytes(env.usage) : '尚未檢查'} />
        <Check label="CPU 執行緒" value={env?.threads || '尚未檢查'} />
        <Check label="GPU 模型" value={inventory ? modelState(inventory.gpu) : '尚未掃描'} />
        <Check label="CPU 模型" value={inventory ? modelState(inventory.cpu) : '尚未掃描'} />
        <Check label="重複快取" value={inventory ? (inventory.duplicates ? inventory.duplicates + ' 個' : '未發現') : '尚未掃描'} />
      </div>

      <div className="local-ai-actions">
        <Button variant="secondary" icon={RefreshCw} onClick={inspect} disabled={busy}>
          全面檢查
        </Button>
        <Button variant="primary" icon={Cpu} onClick={start} disabled={busy || ai.ready}>
          {installed ? '啟動模型' : '下載／啟動'}
        </Button>
        <Button variant="secondary" icon={CheckCircle2} onClick={test} disabled={busy || !ai.ready}>
          測試模型
        </Button>
        <Button variant="secondary" icon={Unplug} onClick={unloadModel} disabled={!ai.ready}>
          卸載 RAM
        </Button>
      </div>

      <div className="local-ai-feature-list">
        <Feature
          label="首頁動態台詞"
          detail="讀取目前專案與今日待辦，產生自然台詞。"
          checked={preferences.aiHomeDialogue !== false}
          onChange={value => onPreferenceChange({ aiHomeDialogue: value })}
        />
        <Feature
          label="自動從本機啟動"
          detail="模型曾下載過時，重新開 App 可從快取啟動。"
          checked={preferences.aiAutoStart !== false}
          onChange={value => onPreferenceChange({ aiAutoStart: value })}
        />
        <Feature
          label="專案草稿整理"
          detail="把雜記整理成目前步驟、本次要做、下一步。"
          checked={preferences.aiProjectAssist !== false}
          onChange={value => onPreferenceChange({ aiProjectAssist: value })}
        />
        <Feature
          label="圖庫標籤建議"
          detail="依 Prompt 與備註產生名稱與標籤。"
          checked={preferences.aiGalleryAssist !== false}
          onChange={value => onPreferenceChange({ aiGalleryAssist: value })}
        />
      </div>

      <LocalAiToolbox />

      <Button variant="danger" full icon={Trash2} onClick={clearModel} disabled={busy}>
        刪除周到本機 AI 模型
      </Button>

      {message && <p className="local-ai-message">{message}</p>}
      <small className="local-ai-footnote">
        Qwen2.5 0.5B｜{profile.quant}｜{profile.download}。模型只處理本機輕量工作。
      </small>
    </div>
  </details>
}

function Status({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>
}

function Check({ label, value }) {
  return <div><span>{label}</span><b>{value}</b></div>
}

function Feature({ label, detail, checked, onChange }) {
  return <div className="local-ai-feature">
    <div><strong>{label}</strong><p>{detail}</p></div>
    <button
      className={'switch ' + (checked ? 'on' : '')}
      onClick={() => onChange(!checked)}
      aria-label={'切換' + label}
    ><span /></button>
  </div>
}

function modelState(model) {
  if (model.installed) return '已安裝'
  if (model.partial) return '部分殘留'
  return '未發現'
}
