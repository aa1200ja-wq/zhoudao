import { useEffect, useState } from 'react'
import { db, markDirty, pendingCount, seedDb } from './db'
import HomeStage from './HomeStage'
import Settings from './Settings'
import PromptLibrary from './PromptLibrary'
import { DEFAULT_SHORTCUTS } from './navigation'

const EMPTY_PROJECT = {
  name: '',
  status: '進行中',
  progress: 0,
  current: '',
  next: '',
  draft: '',
  flowText: '',
  currentStepDetail: '',
  currentTask: '',
  nextDetail: '',
}
const DEFAULT_PREFS = {
  darkMode: false,
  homeBackground: 'cream',
  backgroundImage: '',
  shortcuts: DEFAULT_SHORTCUTS,
  mobilePreview: false,
  promptFolders: ['真人', '情侶', '商品', '場景', '影片'],
}
const NAV_ITEMS = ['首頁', '待辦事項', '專案', '提示詞', '設定']

export default function App() {
  const [page, setPage] = useState('首頁')
  const [projects, setProjects] = useState([])
  const [library, setLibrary] = useState([])
  const [inbox, setInbox] = useState([])
  const [assistant, setAssistant] = useState({ name: '小周', image: '' })
  const [preferences, setPreferences] = useState(DEFAULT_PREFS)
  const [pending, setPending] = useState(0)
  const [modal, setModal] = useState(null)

  async function reload() {
    setProjects(await db.projects.orderBy('updatedAt').reverse().toArray())
    setLibrary(await db.library.orderBy('updatedAt').reverse().toArray())
    setInbox(await db.inbox.orderBy('updatedAt').reverse().toArray())
    setAssistant((await db.settings.get('assistant')) || { name: '小周', image: '' })
    const saved = await db.settings.get('preferences')
    setPreferences({ ...DEFAULT_PREFS, ...(saved || {}), shortcuts: saved?.shortcuts?.length === 4 ? saved.shortcuts : DEFAULT_SHORTCUTS })
    setPending(await pendingCount())
  }

  useEffect(() => { seedDb().then(reload) }, [])

  function openPage(name, project) {
    setPage(name)
    if (project) setModal(project)
  }

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

  async function saveLibrary(item) {
    const id = item.id || 'library-' + crypto.randomUUID()
    await db.library.put({ ...item, id, updatedAt: Date.now() })
    await markDirty()
    reload()
  }

  async function uploadAssistant(file) {
    if (!file) return
    await db.settings.put({ key: 'assistant', name: assistant.name, image: await toDataUrl(file) })
    await markDirty()
    reload()
  }

  async function resetAssistant() {
    await db.settings.put({ key: 'assistant', name: '小周', image: '' })
    await markDirty()
    reload()
  }

  async function updatePreferences(patch) {
    const next = { ...preferences, ...patch, key: 'preferences' }
    await db.settings.put(next)
    await markDirty()
    reload()
  }

  async function uploadBackground(file) {
    if (!file) return
    await updatePreferences({ homeBackground: 'custom', backgroundImage: await toDataUrl(file) })
  }

  return <main className={'app-shell ' + (preferences.darkMode ? 'dark ' : '') + (preferences.mobilePreview ? 'preview-mobile' : '')}>
    {page === '首頁' ? <HomeStage
      assistant={assistant}
      preferences={preferences}
      projects={projects}
      pending={pending}
      onOpenPage={openPage}
    /> : <>
      <header className="page-header">
        <button className="back-button" onClick={() => setPage('首頁')}>‹</button>
        <div><p>周到</p><h1>{page}</h1></div>
        <span className="sync-chip">待同步 {pending}</span>
      </header>

      <section className="page">
        {page === '專案' && <Projects projects={projects} onEdit={setModal} onAdd={() => setModal(EMPTY_PROJECT)} />}
        {page === '待辦事項' && <Todo items={inbox} onAdd={addInbox} />}
        {page === '提示詞' && <PromptLibrary
          items={library}
          folders={preferences.promptFolders}
          onSave={saveLibrary}
          onFoldersChange={folders => updatePreferences({ promptFolders: folders })}
        />}
        {page === '設定' && <Settings
          assistant={assistant}
          preferences={preferences}
          onAssistantUpload={uploadAssistant}
          onAssistantReset={resetAssistant}
          onPreferenceChange={updatePreferences}
          onBackgroundUpload={uploadBackground}
        />}
      </section>

      <InnerNav page={page} onOpen={setPage} />
    </>}

    {modal && <ProjectModal project={modal} onClose={() => setModal(null)} onSave={saveProject} />}
  </main>
}

function InnerNav({ page, onOpen }) {
  return <nav className="inner-nav">
    {NAV_ITEMS.map(item => <button
      key={item}
      className={page === item ? 'active' : ''}
      onClick={() => onOpen(item)}
    >{item}</button>)}
  </nav>
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
    <div className="progress"><i style={{ width: project.progress + '%' }} /></div>
    <p>目前：{project.current || '尚未填寫'}</p>
    <p>下一步：{project.next || '尚未填寫'}</p>
  </button>
}

function Todo({ items, onAdd }) {
  const [text, setText] = useState('')
  return <>
    <div className="composer">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="記點子、提醒自己，或寫下接下來要做的事…" />
      <button onClick={() => { onAdd(text); setText('') }}>存進待辦事項</button>
    </div>
    <Section title="最近記錄">{items.map(item => <article className="card" key={item.id}>
      <p>{item.text}</p><small>{formatTime(item.updatedAt)}</small>
    </article>)}</Section>
  </>
}

function Section({ title, children }) {
  return <section className="section"><h2>{title}</h2><div className="stack">{children}</div></section>
}

function ProjectModal({ project, onClose, onSave }) {
  const [editing, setEditing] = useState(!project.id)
  const [draft, setDraft] = useState(project)

  if (!editing) {
    return <Sheet title="專案續接" onClose={onClose}>
      <div className="project-accordion-stack">
        <ProjectInfoAccordion
          label="項目名稱"
          value={project.name || '尚未填寫'}
        >
          <p><strong>狀態：</strong>{project.status || '尚未填寫'}</p>
          <p><strong>進度：</strong>{project.progress ?? 0}%</p>
          <p><strong>最後更新：</strong>{project.updatedAt ? formatTime(project.updatedAt) : '尚無紀錄'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="目前步驟"
          value={project.current || '尚未填寫'}
        >
          <p>{project.currentStepDetail || project.current || '尚未填寫詳細內容'}</p>
          <p><strong>本次要做：</strong>{project.currentTask || project.current || '尚未填寫'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="下一步"
          value={project.next || '尚未填寫'}
        >
          <p>{project.nextDetail || project.next || '尚未填寫詳細內容'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="我的草稿"
          value={project.draft || '目前沒有草稿'}
        >
          <p>{project.draft || '目前沒有補充內容。'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="專案詳細資料"
          value="完整流程表與續接資訊"
        >
          <section className="project-flow-section">
            <h3>【專案流程表】</h3>
            <pre>{project.flowText || buildFallbackFlow(project)}</pre>
          </section>
          <section className="project-detail-status">
            <p><strong>目前步驟：</strong>{project.currentStepDetail || project.current || '尚未填寫'}</p>
            <p><strong>本次要做：</strong>{project.currentTask || project.current || '尚未填寫'}</p>
            <p><strong>下一步：</strong>{project.nextDetail || project.next || '尚未填寫'}</p>
          </section>
        </ProjectInfoAccordion>
      </div>

      <button className="secondary full" onClick={() => setEditing(true)}>編輯專案資料</button>
    </Sheet>
  }

  return <Sheet title={project.id ? '編輯專案' : '新增專案'} onClose={onClose}>
    <label>項目名稱<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
    <label>目前步驟<textarea value={draft.current} onChange={e => setDraft({ ...draft, current: e.target.value })} /></label>
    <label>下一步<textarea value={draft.next} onChange={e => setDraft({ ...draft, next: e.target.value })} /></label>
    <label>我的草稿<textarea value={draft.draft} onChange={e => setDraft({ ...draft, draft: e.target.value })} /></label>

    <details className="settings-card setting-accordion project-edit-detail">
      <summary>
        <div>
          <strong>詳細專案資料</strong>
          <p>流程表、目前步驟與下一步補充。</p>
        </div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body project-edit-detail-body">
        <label>專案流程表
          <textarea
            className="flow-editor"
            value={draft.flowText || ''}
            onChange={e => setDraft({ ...draft, flowText: e.target.value })}
            placeholder={'☑ 步驟1：…\n□ 步驟2：…\n□ 步驟3：…'}
          />
        </label>
        <label>目前步驟（詳細）
          <textarea value={draft.currentStepDetail || ''} onChange={e => setDraft({ ...draft, currentStepDetail: e.target.value })} />
        </label>
        <label>本次要做
          <textarea value={draft.currentTask || ''} onChange={e => setDraft({ ...draft, currentTask: e.target.value })} />
        </label>
        <label>下一步（詳細）
          <textarea value={draft.nextDetail || ''} onChange={e => setDraft({ ...draft, nextDetail: e.target.value })} />
        </label>
      </div>
    </details>

    <label>進度<input type="range" min="0" max="100" value={draft.progress} onChange={e => setDraft({ ...draft, progress: Number(e.target.value) })} /><span>{draft.progress}%</span></label>
    <button className="primary full" disabled={!draft.name.trim()} onClick={() => onSave(draft)}>
      {project.id ? '儲存修改' : '建立專案'}
    </button>
  </Sheet>
}

function ProjectInfoAccordion({ label, value, children }) {
  return <details className="settings-card setting-accordion project-info-accordion">
    <summary>
      <div>
        <strong>{label}</strong>
        <p>{value}</p>
      </div>
      <span className="accordion-chevron">⌄</span>
    </summary>
    <div className="accordion-body project-info-body">
      {children}
    </div>
  </details>
}

function buildFallbackFlow(project) {
  return [
    '□ ' + (project.current || '目前步驟尚未填寫'),
    '□ ' + (project.next || '下一步尚未填寫'),
  ].join('\n')
}

function Sheet({ title, onClose, children }) {
  return <div className="overlay" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}>
    <div className="row"><h2>{title}</h2><button className="icon" onClick={onClose}>×</button></div>{children}
  </div></div>
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatTime(value) {
  return new Date(value).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}