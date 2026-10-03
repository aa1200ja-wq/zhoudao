import { useState } from 'react'
import { Brain, ListFilter, Sparkles, Tags, WandSparkles } from 'lucide-react'
import Button from './ui/Button'
import {
  answerWorkspaceQuestion,
  classifyCapture,
  organizeProjectDraft,
  suggestTags,
  summarizeText,
  summarizeWorkspace,
} from './ai/localAiTasks'

export default function LocalAiToolbox() {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action) {
    if (!text.trim()) return
    setBusy(true)
    setResult('處理中…')

    try {
      if (action === 'classify') {
        const value = await classifyCapture(text)
        setResult('類型：' + value.type + '\n標題：' + value.title)
      }
      if (action === 'summary') {
        setResult(await summarizeText(text))
      }
      if (action === 'tags') {
        const tags = await suggestTags(text)
        setResult(tags.map(tag => '#' + tag).join(' '))
      }
      if (action === 'project') {
        const value = await organizeProjectDraft(text)
        setResult([
          '目前步驟：' + (value.current || '—'),
          '本次要做：' + (value.currentTask || '—'),
          '下一步：' + (value.next || '—'),
        ].join('\n'))
      }
      if (action === 'workspace') {
        setResult(text.trim()
          ? await answerWorkspaceQuestion(text)
          : await summarizeWorkspace())
      }
    } catch (error) {
      setResult(error?.message || String(error))
    } finally {
      setBusy(false)
    }
  }

  return <details className="local-ai-toolbox">
    <summary>本機 AI 快速工具</summary>
    <div className="local-ai-toolbox-body">
      <textarea
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder="貼一段文字，在手機本機分類、摘要、產生標籤或整理成專案步驟。"
      />

      <div className="local-ai-tool-buttons">
        <Button variant="secondary" size="sm" icon={ListFilter} disabled={busy} onClick={() => run('classify')}>
          判斷分類
        </Button>
        <Button variant="secondary" size="sm" icon={Sparkles} disabled={busy} onClick={() => run('summary')}>
          短摘要
        </Button>
        <Button variant="secondary" size="sm" icon={Tags} disabled={busy} onClick={() => run('tags')}>
          產生標籤
        </Button>
        <Button variant="secondary" size="sm" icon={WandSparkles} disabled={busy} onClick={() => run('project')}>
          整理專案
        </Button>
        <Button variant="secondary" size="sm" icon={Brain} disabled={busy} onClick={() => run('workspace')}>
          問周到資料
        </Button>
      </div>

      {result && <pre className="local-ai-tool-result">{result}</pre>}
    </div>
  </details>
}
