import { useEffect, useState } from 'react'
import { db, markDirty, pendingCount, seedDb } from './db'
import HomeStage from './HomeStage'
import Settings from './Settings'
import PromptLibrary from './PromptLibrary'
import GlobalSearch from './GlobalSearch'
import Todo from './Todo'
import { Projects, ProjectModal } from './ProjectViews'
import Portfolio from './Portfolio'
import { HomeIcon, SettingsIcon } from './AppIcons'
import { DEFAULT_BOTTOM_NAV, DEFAULT_SHORTCUTS, normalizeBottomNav, resolveBottomNav } from './navigation'

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
  const [portfolio, setPortfolio] = useState([])
  const [assistant, setAssistant] = useState({ name: '小周', image: '' })
  const [preferences, setPreferences] = useState(DEFAULT_PREFS)
  const [pending, setPending] = useState(0)
  const [modal, setModal] = useState(null)

  async function reload() {
    setProjects(await db.projects.orderBy('updatedAt').reverse().toArray())
    setLibrary(await db.library.orderBy('updatedAt').reverse().toArray())
    setInbox(await db.inbox.orderBy('updatedAt').reverse().toArray())
    setPortfolio(await db.portfolio.orderBy('updatedAt').reverse().toArray())
    setAssistant((await db.settings.get('assistant')) || { name: '小周', image: '' })
    const saved = await db.settings.get('preferences')
    setPreferences({
      ...DEFAULT_PREFS,
      ...(saved || {}),
      shortcuts: saved?.shortcuts?.length === 4 ? saved.shortcuts : DEFAULT_SHORTCUTS,
      bottomNav: normalizeBottomNav(saved?.bottomNav),
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

  async function savePortfolio(item) {
    const id = item.id || 'portfolio-' + crypto.randomUUID()
    await db.portfolio.put({ ...item, id, updatedAt: Date.now() })
    await markDirty()
    reload()
  }

  async function deletePortfolio(id) {
    await db.portfolio.delete(id)
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
        <button className="corner-nav-button" onClick={() => setPage('首頁')} aria-label="首頁">
          <HomeIcon />
        </button>
        <div><p>周到</p><h1>{page}</h1></div>
        <button className="corner-nav-button" onClick={() => setPage('設定')} aria-label="設定">
          <SettingsIcon />
        </button>
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
        {page === '作品集' && <Portfolio
          items={portfolio}
          onSave={savePortfolio}
          onDelete={deletePortfolio}
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

      <InnerNav page={page} items={normalizeBottomNav(preferences.bottomNav)} onOpen={setPage} />
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



function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
