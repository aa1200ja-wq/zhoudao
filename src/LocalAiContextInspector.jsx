import { useState } from 'react'
import { Eye, RefreshCw } from 'lucide-react'
import Button from './ui/Button'
import {
  buildLocalAiContext,
  contextOverview,
  formatLocalAiContext,
} from './ai/localAiContext'

export default function LocalAiContextInspector() {
  const [open, setOpen] = useState(false)
  const [overview, setOverview] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)

  async function inspect() {
    setBusy(true)
    try {
      const context = await buildLocalAiContext()
      setOverview(contextOverview(context))
      setPreview(formatLocalAiContext(context))
      setOpen(true)
    } finally {
      setBusy(false)
    }
  }

  return <div className="ai-context-inspector">
    <Button variant="secondary" full icon={Eye} disabled={busy} onClick={inspect}>
      {busy ? '讀取周到資料中…' : '查看 AI 目前看得到什麼'}
    </Button>

    {open && overview && <div className="ai-context-panel">
      <div className="ai-context-stats">
        <ContextStat label="目前專案" value={overview.activeProject} />
        <ContextStat label="目前步驟" value={overview.current} />
        <ContextStat label="我的草稿" value={overview.draft ? '可讀取' : '未填'} />
        <ContextStat label="流程表" value={overview.flow ? '可讀取' : '未填'} />
        <ContextStat label="進行中專案" value={overview.projectCount + ' 個'} />
        <ContextStat label="未完成待辦" value={overview.todoCount + ' 項'} />
      </div>

      <details className="ai-context-preview">
        <summary>展開實際送給 Qwen 的資料</summary>
        <pre>{preview}</pre>
      </details>

      <Button variant="ghost" size="sm" icon={RefreshCw} onClick={inspect}>
        重新讀取
      </Button>
    </div>}
  </div>
}

function ContextStat({ label, value }) {
  return <div>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
}
