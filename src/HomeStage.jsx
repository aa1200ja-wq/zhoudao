import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_SHORTCUTS, RIGHT_ACTIONS, resolveShortcut } from './navigation'
import { generateHomeLine } from './ai/localAiTasks'
import { isModelReady, loadModel, wasModelLoadedBefore } from './ai/localAiRuntime'

export default function HomeStage({
  assistant,
  preferences,
  projects,
  inbox,
  pending,
  onOpenPage,
}) {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [lineIndex, setLineIndex] = useState(0)
  const [aiLine, setAiLine] = useState('')
  const [aiBusy, setAiBusy] = useState(false)

  const activeProject = useMemo(() => {
    if (assistant.activeProjectId) {
      const selected = projects.find(project => project.id === assistant.activeProjectId)
      if (selected && !isCompleted(selected)) return selected
    }
    return projects.find(project => !isCompleted(project)) || projects[0] || null
  }, [assistant.activeProjectId, projects])

  const fallbackLines = useMemo(() => {
    const lines = []
    if (assistant.dynamicDialogue && activeProject) {
      if (activeProject.current) lines.push(activeProject.name + '：目前 ' + activeProject.current)
      if (activeProject.next) lines.push(activeProject.name + '：下一步 ' + activeProject.next)
    }
    if (pending > 0) lines.push('目前有 ' + pending + ' 項待同步。')
    lines.push(...(assistant.customLines || []))
    return lines.length ? lines : ['今天想先做什麼？']
  }, [assistant.customLines, assistant.dynamicDialogue, activeProject, pending])

  useEffect(() => {
    if (
      preferences.aiHomeDialogue !== false &&
      preferences.aiAutoStart !== false &&
      wasModelLoadedBefore() &&
      !isModelReady()
    ) {
      loadModel().catch(() => {})
    }
  }, [preferences.aiHomeDialogue, preferences.aiAutoStart])

  async function sayNext() {
    if (preferences.aiHomeDialogue === false || !isModelReady() || aiBusy) {
      setAiLine('')
      setLineIndex(index => (index + 1) % fallbackLines.length)
      return
    }

    const seed = chooseSeed(activeProject, inbox)
    setAiBusy(true)
    try {
      const next = await generateHomeLine({
        ...seed,
        timeOfDay: timeOfDay(),
        lastLine: aiLine || fallbackLines[lineIndex % fallbackLines.length],
      })
      if (next) setAiLine(next)
    } catch (_) {
      setAiLine('')
      setLineIndex(index => (index + 1) % fallbackLines.length)
    } finally {
      setAiBusy(false)
    }
  }

  const line = aiLine || fallbackLines[lineIndex % fallbackLines.length]
  const shortcuts = (preferences.shortcuts?.length === 4
    ? preferences.shortcuts
    : DEFAULT_SHORTCUTS).map(resolveShortcut)

  const bgStyle = preferences.backgroundImage
    ? { backgroundImage: 'linear-gradient(rgba(12,14,18,.12),rgba(12,14,18,.24)),url("' + preferences.backgroundImage + '")' }
    : undefined

  return <section className={'stage home-bg-' + preferences.homeBackground} style={bgStyle}>
    <div className="scene-glass" aria-hidden="true" />

    <header className="identity-strip">
      <span>◇</span><b>周到</b><small>{pending ? '待同步 ' + pending : '已儲存'}</small>
    </header>

    <button
      className="edge-handle edge-left"
      aria-expanded={leftOpen}
      onClick={() => { setLeftOpen(!leftOpen); setRightOpen(false) }}
      aria-label="展開左側快捷功能"
    >‹</button>

    {leftOpen && <aside className="icon-rail icon-rail-left">
      {shortcuts.map((item, index) => <RailAction
        key={item.id + index}
        item={item}
        side="left"
        onClick={() => onOpenPage(item.page)}
      />)}
    </aside>}

    <button
      className="edge-handle edge-right"
      aria-expanded={rightOpen}
      onClick={() => { setRightOpen(!rightOpen); setLeftOpen(false) }}
      aria-label="展開右側功能"
    >›</button>

    {rightOpen && <aside className="icon-rail icon-rail-right">
      {RIGHT_ACTIONS.map(item => <RailAction
        key={item.id}
        item={item}
        side="right"
        onClick={() => onOpenPage(item.page)}
      />)}
    </aside>}

    <section className="hero-zone">
      <button className="hero-button" onClick={sayNext} aria-label="點擊小助手">
        {assistant.image
          ? <img className="hero-image" src={assistant.image} alt="小助手" />
          : <div className="hero-placeholder"><span>{assistant.name || '小周'}</span><small>到設定放入首頁人物</small></div>}
      </button>
    </section>

    <button className="dialogue-layer" onClick={sayNext}>
      <span className="dialogue-name">{assistant.name || '小周'}</span>
      <span className="dialogue-rule" />
      <p>{line}</p>
    </button>
  </section>
}

function chooseSeed(project, inbox = []) {
  const todo = randomItem(inbox.filter(isTodoOpenToday))
  const projectFacts = project ? [
    project.currentTask && project.name + '｜本次要做：' + project.currentTask,
    project.current && project.name + '｜目前：' + project.current,
    project.next && project.name + '｜下一步：' + project.next,
  ].filter(Boolean) : []

  const choices = [{ type: 'greeting', fact: '' }, { type: 'greeting', fact: '' }]
  projectFacts.forEach(fact => choices.push({ type: 'project', fact }))
  if (todo) choices.push({ type: 'todo', fact: todo.text })
  return randomItem(choices) || { type: 'greeting', fact: '' }
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function RailAction({ item, side, onClick }) {
  return <button className={'rail-item rail-' + side} onClick={onClick}>
    <span className="rail-icon">{item.icon}</span>
    <small>{item.label}</small>
  </button>
}

function isCompleted(project) {
  const status = String(project?.status || '')
  return Boolean(project?.archived)
    || status.includes('完成')
    || status.includes('封存')
    || status.includes('結案')
}

function isTodoOpenToday(item) {
  const today = dayKey()
  if (item.completedDate === today || item.skippedDate === today) return false
  if (item.completed && dayKey(item.updatedAt) === today) return false
  return true
}

function dayKey(value = Date.now()) {
  const date = new Date(value)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function timeOfDay() {
  const hour = new Date().getHours()
  if (hour < 6) return '深夜'
  if (hour < 12) return '上午'
  if (hour < 18) return '下午'
  return '晚上'
}
