import { useEffect, useMemo, useState } from 'react'
import { db, markDirty, pendingCount, seedDb } from './db'

const TABS = ['首頁', '專案', '收件匣', 'Prompt']
const EMPTY_PROJECT = { name: '', status: '進行中', progress: 0, current: '', next: '', draft: '' }

export default function App() {
  const [tab, setTab] = useState('首頁')
  const [projects, setProjects] = useState([])
  const [library, setLibrary] = useState([])
  const [inbox, setInbox] = useState([])
  const [assistant, setAssistant] = useState({ name: '小周', image: '' })
  const [pending, setPending] = useState(0)
  const [modal, setModal] = useState(null)

  async function reload() {
    setProjects(await db.projects.orderBy('updatedAt').reverse().toArray())
    setLibrary(await db.library.orderBy('updatedAt').reverse().toArray())
    setInbox(await db.inbox.orderBy('updatedAt').reverse().toArray())
    setAssistant((await db.settings.get('assistant')) || { name: '小周', image: '' })
    setPending(await pendingCount())
  }

  useEffect(() => { seedDb().then(reload) }, [])

  async function saveProject(project) {
    const id = project.id || 'project-' + crypto.randomUUID()
    await db.projects.put({ ...project, id, updatedAt: Date.now() })
    await markDirty()
    setModal(null)
    reload()
  }

  async function addInbox(text) {
    if (!text.trim()) return
    await db.inbox.add({ text: text.trim(), updatedAt: Date.now(), synced: 0 })
    reload()
  }

  async function addLibrary(item) {
    await db.library.put({ ...item, id: 'library-' + crypto.randomUUID(), updatedAt: Date.now() })
    await markDirty()
    reload()
  }

  async function uploadAssistant(file) {
    if (!file) return
    const image = await toDataUrl(file)
    await db.settings.put({ key: 'assistant', name: assistant.name, image })
    await markDirty()
    reload()
  }

  const homeMessage = useMemo(() => {
    const next = projects[0]?.next || '先新增第一個專案'
    return pending ? '目前有 ' + pending + ' 項待同步' : '下一步：' + next
  }, [pending, projects])

  return <main className="app-shell">
    <header className="topbar">
      <div><p className="eyebrow">周到</p><h1>{tab}</h1></div>
      <span className="sync-chip">待同步 {pending}</span>
    </header>

    <section className="page">
      {tab === '首頁' && <Home assistant={assistant} message={homeMessage} projects={projects} onUpload={uploadAssistant} onEdit={setModal} />}
      {tab === '專案' && <Projects projects={projects} onEdit={setModal} onAdd={() => setModal(EMPTY_PROJECT)} />}
      {tab === '收件匣' && <Inbox items={inbox} onAdd={addInbox} />}
      {tab === 'Prompt' && <Library items={library} onAdd={addLibrary} />}
    </section>

    <footer className="actions">
      <button className="secondary" onClick={() => alert('目前內容皆已自動儲存在這台裝置')}>儲存</button>
      <button className="primary" onClick={() => alert('MVP 階段尚未接 GitHub，同步功能會在最後串接')}>同步 GitHub</button>
    </footer>

    <nav className="bottom-nav">
      {TABS.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
    </nav>

    {modal && <ProjectModal project={modal} onClose={() => setModal(null)} onSave={saveProject} />}
  </main>
}

function Home({ assistant, message, projects, onUpload, onEdit }) {
  const [line, setLine] = useState(message)
  useEffect(() => setLine(message), [message])
  const sayNext = () => {
    const item = projects[Math.floor(Math.random() * Math.max(projects.length, 1))]
    setLine(item?.next ? item.name + '：' + item.next : message)
  }
  return <>
    <section className="assistant-card">
      <div className="assistant-visual">
        <button className="portrait" onClick={sayNext} title="跟小助手互動">
          {assistant.image ? <img src={assistant.image} alt="小助手" /> : <span>小周</span>}
        </button>
        <label className="change-photo">換圖<input hidden type="file" accept="image/*" onChange={e => onUpload(e.target.files?.[0])} /></label>
      </div>
      <button className="speech" onClick={sayNext}>{line}</button>
      <p className="hint">點角色會講話；「換圖」可指定首頁小助手形象。</p>
    </section>
    <Section title="最近專案">{projects.slice(0, 3).map(p => <ProjectCard key={p.id} project={p} onEdit={onEdit} />)}</Section>
  </>
}

function Projects({ projects, onEdit, onAdd }) {
  return <>
    <button className="add-card" onClick={onAdd}>＋ 新增專案</button>
    <Section title="全部專案">{projects.map(p => <ProjectCard key={p.id} project={p} onEdit={onEdit} />)}</Section>
  </>
}

function ProjectCard({ project, onEdit }) {
  return <button className="card project-card" onClick={() => onEdit(project)}>
    <div className="row"><strong>{project.name}</strong><span>{project.status}</span></div>
    <div className="progress"><i style={{ width: String(project.progress) + '%' }} /></div>
    <p>目前：{project.current || '尚未填寫'}</p><p>下一步：{project.next || '尚未填寫'}</p>
  </button>
}

function Inbox({ items, onAdd }) {
  const [text, setText] = useState('')
  return <>
    <div className="composer"><textarea value={text} onChange={e => setText(e.target.value)} placeholder="先亂寫沒關係，之後再整理…"/><button onClick={() => { onAdd(text); setText('') }}>存進收件匣</button></div>
    <Section title="最近記錄">{items.map(item => <article className="card" key={item.id}><p>{item.text}</p><small>{formatTime(item.updatedAt)}</small></article>)}</Section>
  </>
}

function Library({ items, onAdd }) {
  const [showAdd, setShowAdd] = useState(false)
  return <>
    <button className="add-card" onClick={() => setShowAdd(true)}>＋ 新增 Prompt／素材</button>
    <Section title="Prompt／素材">{items.map(item => <article className="card" key={item.id}>
      {item.image && <img className="library-image" src={item.image} alt="素材預覽" />}
      <div className="row"><strong>{item.title}</strong><span>{item.type}</span></div>
      <p>{item.content}</p><div className="tags">{item.tags?.map(tag => <em key={tag}>{'#' + tag}</em>)}</div>
    </article>)}</Section>
    {showAdd && <LibraryModal onClose={() => setShowAdd(false)} onSave={async item => { await onAdd(item); setShowAdd(false) }} />}
  </>
}

function Section({ title, children }) { return <section className="section"><h2>{title}</h2><div className="stack">{children}</div></section> }

function ProjectModal({ project, onClose, onSave }) {
  const [draft, setDraft] = useState(project)
  return <Sheet title={project.id ? project.name : '新增專案'} onClose={onClose}>
    <label>專案名稱<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label>
    <label>目前做到<textarea value={draft.current} onChange={e => setDraft({ ...draft, current: e.target.value })}/></label>
    <label>下一步<textarea value={draft.next} onChange={e => setDraft({ ...draft, next: e.target.value })}/></label>
    <label>我的草稿<textarea value={draft.draft} onChange={e => setDraft({ ...draft, draft: e.target.value })}/></label>
    <label>進度<input type="range" min="0" max="100" value={draft.progress} onChange={e => setDraft({ ...draft, progress: Number(e.target.value) })}/><span>{draft.progress}%</span></label>
    <button className="primary full" disabled={!draft.name.trim()} onClick={() => onSave(draft)}>儲存修改</button>
  </Sheet>
}

function LibraryModal({ onClose, onSave }) {
  const [draft, setDraft] = useState({ title: '', type: 'Prompt', content: '', tags: '', image: '' })
  async function chooseImage(file) { if (file) setDraft({ ...draft, image: await toDataUrl(file) }) }
  return <Sheet title="新增 Prompt／素材" onClose={onClose}>
    <label>名稱<input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label>
    <label>Prompt／備註<textarea value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })}/></label>
    <label>標籤（逗號分隔）<input value={draft.tags} onChange={e => setDraft({ ...draft, tags: e.target.value })}/></label>
    <label className="upload">選擇圖片<input type="file" accept="image/*" onChange={e => chooseImage(e.target.files?.[0])}/></label>
    {draft.image && <img className="preview" src={draft.image} alt="預覽" />}
    <button className="primary full" disabled={!draft.title.trim()} onClick={() => onSave({ ...draft, tags: draft.tags.split(',').map(x => x.trim()).filter(Boolean) })}>存到素材庫</button>
  </Sheet>
}

function Sheet({ title, onClose, children }) {
  return <div className="overlay" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}>
    <div className="row"><h2>{title}</h2><button className="icon" onClick={onClose}>×</button></div>{children}
  </div></div>
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file)
  })
}
function formatTime(value) { return new Date(value).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
