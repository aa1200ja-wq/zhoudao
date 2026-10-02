import { useMemo, useState } from 'react'

const DEFAULT_FOLDERS = ['真人', '情侶', '商品', '場景', '影片']
const SPECIAL_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'unfiled', label: '未整理' },
  { id: 'verified', label: '已驗證' },
  { id: 'favorite', label: '收藏' },
]

export default function PromptLibrary({
  items,
  folders = DEFAULT_FOLDERS,
  onSave,
  onFoldersChange,
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showFolderManager, setShowFolderManager] = useState(false)

  const folderList = useMemo(() => {
    const merged = [...DEFAULT_FOLDERS, ...(folders || [])]
    items.forEach(item => {
      if (item.folder && item.folder !== '未整理') merged.push(item.folder)
    })
    return [...new Set(merged.filter(Boolean))]
  }, [folders, items])

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return items.filter(item => {
      const folder = item.folder || '未整理'
      const filterMatch =
        filter === 'all' ||
        (filter === 'unfiled' && folder === '未整理') ||
        (filter === 'verified' && item.verified) ||
        (filter === 'favorite' && item.favorite) ||
        folder === filter
      if (!filterMatch) return false
      if (!keyword) return true
      const haystack = [
        item.title,
        item.content,
        folder,
        ...(item.tags || []),
      ].join(' ').toLowerCase()
      return haystack.includes(keyword)
    })
  }, [items, query, filter])

  async function quickPatch(item, patch) {
    const next = { ...item, ...patch }
    await onSave(next)
    setSelected(next)
  }

  function addFolder() {
    const name = window.prompt('新資料夾名稱')
    const clean = name?.trim()
    if (!clean || folderList.includes(clean)) return
    onFoldersChange([...folderList, clean])
    setFilter(clean)
  }

  return <div className="prompt-library">
    <div className="prompt-toolbar">
      <div className="prompt-search">
        <span>⌕</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜尋名稱、Prompt、標籤…"
        />
      </div>
      <button className="prompt-add" onClick={() => setEditing(emptyPrompt(folderList[0]))}>＋</button>
    </div>

    <div className="folder-strip">
      {SPECIAL_FILTERS.map(item => <button
        key={item.id}
        className={filter === item.id ? 'active' : ''}
        onClick={() => setFilter(item.id)}
      >{item.label}</button>)}
      {folderList.map(folder => <button
        key={folder}
        className={filter === folder ? 'active' : ''}
        onClick={() => setFilter(folder)}
      >{folder}</button>)}
      <button className="folder-add" onClick={addFolder}>＋資料夾</button>
      <button className="folder-manage" onClick={() => setShowFolderManager(true)}>管理</button>
    </div>

    <div className="prompt-summary">
      <span>{labelForFilter(filter, folderList)}</span>
      <small>{visible.length} 筆</small>
    </div>

    {visible.length ? <div className="prompt-grid">
      {visible.map(item => <button
        key={item.id}
        className="prompt-tile"
        onClick={() => setSelected(item)}
      >
        <div className={'prompt-thumb ' + (!item.image ? 'no-image' : '')}>
          {item.image
            ? <img src={item.image} alt={item.title} />
            : <span>✦</span>}
          <button
            className={'favorite-badge ' + (item.favorite ? 'active' : '')}
            onClick={e => {
              e.stopPropagation()
              quickPatch(item, { favorite: !item.favorite })
            }}
            aria-label="收藏"
          >☆</button>
          {item.verified && <span className="verified-badge">已驗證</span>}
        </div>
        <div className="prompt-tile-copy">
          <strong>{item.title}</strong>
          <small>{item.folder || '未整理'}</small>
          <div className="prompt-tile-tags">
            {(item.tags || []).slice(0, 3).map(tag => <em key={tag}>#{tag}</em>)}
          </div>
        </div>
      </button>)}
    </div> : <div className="prompt-empty">
      <span>✦</span>
      <strong>這裡還沒有內容</strong>
      <p>換個資料夾、搜尋詞，或新增一組提示詞。</p>
    </div>}

    {selected && <PromptDetail
      item={selected}
      folders={folderList}
      onClose={() => setSelected(null)}
      onEdit={() => {
        setEditing(selected)
        setSelected(null)
      }}
      onPatch={patch => quickPatch(selected, patch)}
    />}

    {editing && <PromptEditor
      item={editing}
      folders={folderList}
      onClose={() => setEditing(null)}
      onSave={async item => {
        await onSave(item)
        setEditing(null)
      }}
    />}

    {showFolderManager && <FolderManager
      folders={folderList}
      onClose={() => setShowFolderManager(false)}
      onSave={next => {
        onFoldersChange(next)
        setShowFolderManager(false)
        if (!SPECIAL_FILTERS.some(x => x.id === filter) && !next.includes(filter)) {
          setFilter('all')
        }
      }}
    />}
  </div>
}

function PromptDetail({ item, folders, onClose, onEdit, onPatch }) {
  async function copyPrompt() {
    await navigator.clipboard.writeText(item.content || '')
  }

  return <Sheet title={item.title} onClose={onClose}>
    {item.image && <img className="prompt-detail-image" src={item.image} alt={item.title} />}
    <div className="prompt-detail-meta">
      <span>{item.folder || '未整理'}</span>
      <div>
        <button className={item.favorite ? 'active' : ''} onClick={() => onPatch({ favorite: !item.favorite })}>☆ 收藏</button>
        <button className={item.verified ? 'active' : ''} onClick={() => onPatch({ verified: !item.verified })}>✓ 已驗證</button>
      </div>
    </div>
    <div className="prompt-detail-tags">
      {(item.tags || []).map(tag => <em key={tag}>#{tag}</em>)}
    </div>
    <div className="prompt-copy-block">
      <small>PROMPT</small>
      <p>{item.content || '尚未填寫提示詞內容。'}</p>
    </div>
    {item.note && <div className="prompt-note"><small>備註</small><p>{item.note}</p></div>}
    <div className="prompt-detail-actions">
      <button className="secondary" onClick={onEdit}>編輯</button>
      <button className="primary" onClick={copyPrompt}>複製 Prompt</button>
    </div>
    <label className="prompt-move">
      <span>移到資料夾</span>
      <select value={item.folder || '未整理'} onChange={e => onPatch({ folder: e.target.value })}>
        <option value="未整理">未整理</option>
        {folders.map(folder => <option key={folder} value={folder}>{folder}</option>)}
      </select>
    </label>
  </Sheet>
}

function PromptEditor({ item, folders, onClose, onSave }) {
  const [draft, setDraft] = useState({
    ...emptyPrompt(folders[0]),
    ...item,
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
  })

  async function chooseImage(file) {
    if (!file) return
    setDraft({ ...draft, image: await toDataUrl(file) })
  }

  return <Sheet title={draft.id ? '編輯提示詞' : '新增提示詞'} onClose={onClose}>
    <label>名稱<input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
    <label>資料夾
      <select value={draft.folder || '未整理'} onChange={e => setDraft({ ...draft, folder: e.target.value })}>
        <option value="未整理">未整理</option>
        {folders.map(folder => <option key={folder} value={folder}>{folder}</option>)}
      </select>
    </label>
    <label>Prompt<textarea value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} /></label>
    <label>標籤（逗號分隔）<input value={draft.tags} onChange={e => setDraft({ ...draft, tags: e.target.value })} /></label>
    <label>備註<textarea value={draft.note || ''} onChange={e => setDraft({ ...draft, note: e.target.value })} /></label>
    <label className="upload">選擇圖片<input type="file" accept="image/*" onChange={e => chooseImage(e.target.files?.[0])} /></label>
    {draft.image && <img className="preview" src={draft.image} alt="預覽" />}
    <div className="editor-checks">
      <button className={draft.favorite ? 'active' : ''} onClick={() => setDraft({ ...draft, favorite: !draft.favorite })}>☆ 收藏</button>
      <button className={draft.verified ? 'active' : ''} onClick={() => setDraft({ ...draft, verified: !draft.verified })}>✓ 已驗證</button>
    </div>
    <button
      className="primary full"
      disabled={!draft.title.trim()}
      onClick={() => onSave({
        ...draft,
        tags: String(draft.tags).split(',').map(x => x.trim()).filter(Boolean),
      })}
    >儲存提示詞</button>
  </Sheet>
}

function FolderManager({ folders, onClose, onSave }) {
  const [drafts, setDrafts] = useState(folders)

  return <Sheet title="管理資料夾" onClose={onClose}>
    <div className="folder-manager">
      {drafts.map((folder, index) => <div className="folder-manager-row" key={index}>
        <input
          value={folder}
          onChange={e => {
            const next = [...drafts]
            next[index] = e.target.value
            setDrafts(next)
          }}
        />
        <button onClick={() => setDrafts(drafts.filter((_, i) => i !== index))}>×</button>
      </div>)}
      <button className="secondary full" onClick={() => setDrafts([...drafts, '新資料夾'])}>＋ 新增資料夾</button>
    </div>
    <button
      className="primary full"
      onClick={() => onSave([...new Set(drafts.map(x => x.trim()).filter(Boolean))])}
    >儲存資料夾</button>
  </Sheet>
}

function Sheet({ title, onClose, children }) {
  return <div className="overlay" onMouseDown={onClose}>
    <div className="modal prompt-sheet" onMouseDown={e => e.stopPropagation()}>
      <div className="row"><h2>{title}</h2><button className="icon" onClick={onClose}>×</button></div>
      {children}
    </div>
  </div>
}

function emptyPrompt(folder) {
  return {
    title: '',
    type: 'Prompt',
    content: '',
    note: '',
    tags: [],
    image: '',
    folder: folder || '未整理',
    favorite: false,
    verified: false,
  }
}

function labelForFilter(filter, folders) {
  const special = SPECIAL_FILTERS.find(item => item.id === filter)
  if (special) return special.label
  return folders.includes(filter) ? filter : '全部'
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}