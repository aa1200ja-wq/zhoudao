import { useEffect, useMemo, useState } from 'react'

const MENU = ['專案', '收件匣', 'Prompt', '設定']

export default function HomeStage({
  assistant,
  preferences,
  projects,
  pending,
  onOpenPage,
  onToggleDark,
}) {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  function closeDrawers() {
    setLeftOpen(false)
    setRightOpen(false)
  }

  const bgStyle = preferences.backgroundImage
    ? { backgroundImage: 'linear-gradient(rgba(12,14,18,.18),rgba(12,14,18,.32)),url("' + preferences.backgroundImage + '")' }
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
    >‹</button>

    {leftOpen && <aside className="side-drawer drawer-left">
      <p className="drawer-kicker">CURRENT</p>
      <h3>進行中的專案</h3>
      <div className="drawer-projects">
        {projects.slice(0, 4).map(project => <button
          key={project.id}
          className="drawer-project"
          onClick={() => { closeDrawers(); onOpenPage('專案', project) }}
        >
          <strong>{project.name}</strong>
          <small>{project.next || project.current || '尚未設定下一步'}</small>
        </button>)}
        {!projects.length && <p className="drawer-empty">目前沒有專案。</p>}
      </div>
      <button className="drawer-link" onClick={() => onOpenPage('專案')}>查看全部專案</button>
    </aside>}

    <button
      className="edge-handle edge-right"
      aria-expanded={rightOpen}
      onClick={() => { setRightOpen(!rightOpen); setLeftOpen(false) }}
    >›</button>

    {rightOpen && <aside className="side-drawer drawer-right">
      <p className="drawer-kicker">TOOLS</p>
      <button onClick={onToggleDark}>{preferences.darkMode ? '切換淺色模式' : '切換深色模式'}</button>
      <button onClick={() => onOpenPage('設定')}>人物／背景設定</button>
      <button onClick={() => onOpenPage('收件匣')}>快速記錄</button>
      <button onClick={() => onOpenPage('Prompt')}>Prompt／素材</button>
      <div className="sync-note">同步 GitHub 尚未啟用</div>
    </aside>}

    <section className="hero-zone">
      <button className="hero-button" onClick={sayNext} aria-label="點擊小助手">
        {assistant.image
          ? <img className="hero-image" src={assistant.image} alt="小助手" />
          : <div className="hero-placeholder"><span>小周</span><small>到設定放入首頁人物</small></div>}
      </button>
    </section>

    <button className="speech-line" onClick={sayNext}>
      <span className="speaker-name">{assistant.name || '小周'}</span>
      <p>{line}</p>
    </button>

    {menuOpen && <nav className="petal-menu" aria-label="主要功能">
      {MENU.map((item, index) => <button
        key={item}
        className={'petal petal-' + index}
        onClick={() => { setMenuOpen(false); onOpenPage(item) }}
      >{item}</button>)}
    </nav>}

    <button
      className="core-button"
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen(!menuOpen)}
      aria-label="展開功能"
    >
      <span className="core-ring" />
      <span className="core-diamond">◇</span>
    </button>
  </section>
}