import { useEffect, useState } from 'react'
import { db, markDirty, pendingCount, seedDb } from './db'
import HomeStage from './HomeStage'
import Settings from './Settings'
import PromptLibrary from './PromptLibrary'
import GlobalSearch from './GlobalSearch'
import { DEFAULT_BOTTOM_NAV, DEFAULT_SHORTCUTS, resolveBottomNav } from './navigation'

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
  architectureText: '',
  changelogText: '',
}
const DEFAULT_PREFS = {
  darkMode: false,
  homeBackground: 'cream',
  backgroundImage: '',
  shortcuts: DEFAULT_SHORTCUTS,
  mobilePreview: false,
  promptFolders: ['真人', '情侶', '商品', '場景', '影片'],
  bottomNav: DEFAULT_BOTTOM_NAV,
}
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
    setPreferences({
      ...DEFAULT_PREFS,
      ...(saved || {}),
      shortcuts: saved?.shortcuts?.length === 4 ? saved.shortcuts : DEFAULT_SHORTCUTS,
      bottomNav: saved?.bottomNav?.length === 5 ? saved.bottomNav : DEFAULT_BOTTOM_NAV,
    })
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
    await db.inbox.add({
      text: text.trim(),
      bucket: 'today',
      completed: false,
      pinned: false,
      updatedAt: Date.now(),
      synced: 0,
    })
    reload()
  }

  async function updateInbox(item, patch) {
    await db.inbox.put({
      ...item,
      ...patch,
      updatedAt: Date.now(),
      synced: 0,
    })
    reload()
  }

  async function deleteInbox(id) {
    await db.inbox.delete(id)
    reload()
  }

  async function convertInboxToProject(item) {
    const project = {
      ...EMPTY_PROJECT,
      id: 'project-' + crypto.randomUUID(),
      name: item.text.length > 36 ? item.text.slice(0, 36) + '…' : item.text,
      current: '由待辦事項建立',
      draft: item.text,
      updatedAt: Date.now(),
    }
    await db.projects.put(project)
    await markDirty()
    await db.inbox.put({
      ...item,
      completed: true,
      updatedAt: Date.now(),
      synced: 0,
    })
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
        {page === '待辦事項' && <Todo
          items={inbox}
          onAdd={addInbox}
          onUpdate={updateInbox}
          onDelete={deleteInbox}
          onConvert={convertInboxToProject}
        />}
        {page === '提示詞' && <PromptLibrary
          items={library}
          folders={preferences.promptFolders}
          onSave={saveLibrary}
          onFoldersChange={folders => updatePreferences({ promptFolders: folders })}
        />}
        {page === '全域搜尋' && <GlobalSearch
          projects={projects}
          inbox={inbox}
          library={library}
          onOpenPage={setPage}
          onOpenProject={project => setModal(project)}
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

      <InnerNav page={page} items={preferences.bottomNav} onOpen={setPage} />
    </>}

    {modal && <ProjectModal project={modal} onClose={() => setModal(null)} onSave={saveProject} />}
  </main>
}

function InnerNav({ page, items, onOpen }) {
  return <nav className="inner-nav">
    {items.map(item => {
      const nav = resolveBottomNav(item)
      return <button
        key={nav.page}
        className={page === nav.page ? 'active' : ''}
        onClick={() => onOpen(nav.page)}
      >{nav.label}</button>
    })}
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

function Todo({ items, onAdd, onUpdate, onDelete, onConvert }) {
  const [text, setText] = useState('')
  const [tab, setTab] = useState('today')
  const [menuId, setMenuId] = useState(null)

  const normalized = items.map(item => ({
    ...item,
    bucket: item.bucket || 'today',
    completed: Boolean(item.completed),
    pinned: Boolean(item.pinned),
  }))

  const visible = normalized
    .filter(item => {
      if (tab === 'completed') return item.completed
      if (item.completed) return false
      return item.bucket === tab
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)

  const counts = {
    today: normalized.filter(item => !item.completed && item.bucket === 'today').length,
    later: normalized.filter(item => !item.completed && item.bucket === 'later').length,
    completed: normalized.filter(item => item.completed).length,
  }

  return <div className="todo-page">
    <div className="composer todo-composer">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="記點子、提醒自己，或寫下接下來要做的事…"
      />
      <button onClick={() => {
        onAdd(text)
        setText('')
        setTab('today')
      }}>存進待辦事項</button>
    </div>

    <div className="todo-tabs">
      <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
        今天 <span>{counts.today}</span>
      </button>
      <button className={tab === 'later' ? 'active' : ''} onClick={() => setTab('later')}>
        之後 <span>{counts.later}</span>
      </button>
      <button className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>
        完成 <span>{counts.completed}</span>
      </button>
    </div>

    {visible.length ? <div className="todo-list">
      {visible.map(item => <article className={'todo-item ' + (item.completed ? 'done' : '')} key={item.id}>
        <button
          className={'todo-check ' + (item.completed ? 'checked' : '')}
          onClick={() => onUpdate(item, { completed: !item.completed })}
          aria-label={item.completed ? '標記未完成' : '標記完成'}
        >{item.completed ? '✓' : ''}</button>

        <button className="todo-main" onClick={() => setMenuId(menuId === item.id ? null : item.id)}>
          <div className="todo-text-row">
            <p>{item.text}</p>
            {item.pinned && <span className="todo-pin">置頂</span>}
          </div>
          <small>{item.completed ? '已完成' : item.bucket === 'later' ? '之後' : '今天'} · {formatTime(item.updatedAt)}</small>
        </button>

        <button className="todo-more" onClick={() => setMenuId(menuId === item.id ? null : item.id)}>⋯</button>

        {menuId === item.id && <div className="todo-menu">
          {!item.completed && <button onClick={() => {
            onUpdate(item, { bucket: item.bucket === 'today' ? 'later' : 'today' })
            setMenuId(null)
          }}>{item.bucket === 'today' ? '移到之後' : '移到今天'}</button>}
          <button onClick={() => {
            onUpdate(item, { pinned: !item.pinned })
            setMenuId(null)
          }}>{item.pinned ? '取消置頂' : '置頂'}</button>
          {!item.completed && <button onClick={() => {
            onConvert(item)
            setMenuId(null)
          }}>轉成專案</button>}
          {item.completed && <button onClick={() => {
            onUpdate(item, { completed: false, bucket: 'today' })
            setMenuId(null)
          }}>恢復到今天</button>}
          <button className="danger" onClick={() => {
            onDelete(item.id)
            setMenuId(null)
          }}>刪除</button>
        </div>}
      </article>)}
    </div> : <div className="todo-empty">
      <strong>{tab === 'today' ? '今天沒有待辦' : tab === 'later' ? '之後沒有待辦' : '還沒有完成項目'}</strong>
      <p>{tab === 'today' ? '有想到什麼就直接記一句。' : '這裡會保持乾淨。'}</p>
    </div>}
  </div>
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
          <p><strong>目前步驟：</strong>{project.currentStepDetail || project.current || '尚未填寫'}</p>
          <p><strong>本次要做：</strong>{project.currentTask || project.current || '尚未填寫'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="下一步"
          value={project.next || '尚未填寫'}
        >
          <p><strong>下一步：</strong>{project.nextDetail || project.next || '尚未填寫詳細內容'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="我的草稿"
          value={project.draft || '目前沒有草稿'}
        >
          <p>{project.draft || '目前沒有補充內容。'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="專案流程表"
          value="步驟、目前進度與下一步"
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

        <ProjectInfoAccordion
          label="專案詳細資料"
          value="README 式架構與版本紀錄"
        >
          <section className="project-readme-section">
            <h3>目前大架構</h3>
            <pre>{project.architectureText || '尚未建立專案架構摘要。'}</pre>
          </section>
          <section className="project-readme-section">
            <h3>版本變更紀錄</h3>
            <pre>{project.changelogText || '尚未建立版本變更紀錄。'}</pre>
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
          <strong>專案流程表</strong>
          <p>步驟、目前進度、本次要做與下一步。</p>
        </div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body project-edit-detail-body">
        <label>流程表
          <textarea
            className="flow-editor"
            value={draft.flowText || ''}
            onChange={e => setDraft({ ...draft, flowText: e.target.value })}
            placeholder={'☑ 步驟1：…\n☑ 步驟2：…\n□ 步驟3：…'}
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

    <details className="settings-card setting-accordion project-edit-detail">
      <summary>
        <div>
          <strong>專案詳細資料</strong>
          <p>README 式架構摘要與版本累積紀錄。</p>
        </div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body project-edit-detail-body">
        <label>目前大架構
          <textarea
            className="readme-editor"
            value={draft.architectureText || ''}
            onChange={e => setDraft({ ...draft, architectureText: e.target.value })}
            placeholder={'### 目前大架構\n- 核心資料流…\n- 主要功能…\n- 儲存方式…'}
          />
        </label>
        <label>版本變更紀錄
          <textarea
            className="readme-editor"
            value={draft.changelogText || ''}
            onChange={e => setDraft({ ...draft, changelogText: e.target.value })}
            placeholder={'### V1\n- 建立中央資料庫\n\n### V2\n- 改成 GitHub 為長期記憶…'}
          />
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