import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_SHORTCUTS, RIGHT_ACTIONS, resolveShortcut } from './navigation'

export default function HomeStage({
  assistant,
  preferences,
  projects,
  pending,
  onOpenPage,
}) {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [line, setLine] = useState('')

  const message = useMemo(() => {
    if (pending > 0) return '目前有 ' + pending + ' 項待同步。'
    const next = projects[0]?.next
    return next ? '下一步：' + next : '今天想先記下什麼？'
  }, [pending, projects])

  useEffect(() => setLine(message), [message])

  function sayNext() {
    if (!projects.length) {
      setLine('有想法就先記下來，我幫你留著。')
      return
    }
    const project = projects[Math.floor(Math.random() * projects.length)]
    setLine(project.name + '：' + (project.next || project.current || '先整理下一步。'))
  }

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
          : <div className="hero-placeholder"><span>小周</span><small>到設定放入首頁人物</small></div>}
      </button>
    </section>

    <button className="dialogue-layer" onClick={sayNext}>
      <span className="dialogue-name">{assistant.name || '小周'}</span>
      <span className="dialogue-rule" />
      <p>{line}</p>
    </button>
  </section>
}

function RailAction({ item, side, onClick }) {
  return <button className={'rail-item rail-' + side} onClick={onClick}>
    <span className="rail-icon">{item.icon}</span>
    <small>{item.label}</small>
  </button>
}