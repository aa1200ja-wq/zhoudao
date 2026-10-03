import { useMemo, useState } from 'react'
import { Folder, Heart, Image, Plus, Search, X } from 'lucide-react'
import { FolderManager, PromptEditor, emptyPrompt, labelForFilter } from './PromptPanels'
import GalleryViewer from './GalleryViewer'
import { DEFAULT_FOLDERS, SPECIAL_FILTERS } from './promptConfig'

export default function PromptLibrary({
  items,
  folders = DEFAULT_FOLDERS,
  onSave,
  onFoldersChange,
}) {
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
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

  return <div className="prompt-library">
    <div className="prompt-primary-actions">
      <button
        className={searchOpen ? 'active' : ''}
        onClick={() => setSearchOpen(!searchOpen)}
      ><Search aria-hidden="true" />搜尋</button>
      <button className="primary-action" onClick={() => setEditing(emptyPrompt('未整理'))}>
        <Plus aria-hidden="true" />新增
      </button>
      <button onClick={() => setShowFolderManager(true)}>
        <Folder aria-hidden="true" />資料夾
      </button>
    </div>

    {searchOpen && <div className="prompt-search prompt-search-expanded">
      <Search aria-hidden="true" />
      <input
        autoFocus
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜尋圖片名稱、Prompt、標籤…"
      />
      {query && <button className="search-clear" onClick={() => setQuery('')} aria-label="清除搜尋">
        <X aria-hidden="true" />
      </button>}
    </div>}

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
    </div>

    <div className="prompt-summary">
      <span>{labelForFilter(filter, folderList)}</span>
      <small>{visible.length} 筆</small>
    </div>

    {visible.length ? <div className="prompt-grid">
      {visible.map(item => <div
        key={item.id}
        className="prompt-tile"
        role="button"
        tabIndex={0}
        onClick={() => setSelected(item)}
        onKeyDown={e => { if (e.key === 'Enter') setSelected(item) }}
      >
        <div className={'prompt-thumb ' + (!item.image ? 'no-image' : '')}>
          {item.image
            ? <img src={item.image} alt={item.title} />
            : <Image aria-hidden="true" />}
          <button
            className={'favorite-badge ' + (item.favorite ? 'active' : '')}
            onClick={e => {
              e.stopPropagation()
              quickPatch(item, { favorite: !item.favorite })
            }}
            aria-label="收藏"
          ><Heart aria-hidden="true" /></button>
          {item.verified && <span className="verified-badge">已驗證</span>}
        </div>
        <div className="prompt-tile-copy">
          <strong>{item.title}</strong>
          <small>{item.folder || '未整理'}</small>
          <div className="prompt-tile-tags">
            {(item.tags || []).slice(0, 3).map(tag => <em key={tag}>#{tag}</em>)}
          </div>
        </div>
      </div>)}
    </div> : <div className="prompt-empty">
      <Image aria-hidden="true" />
      <strong>這裡還沒有內容</strong>
      <p>換個資料夾、搜尋詞，或新增一組提示詞。</p>
    </div>}

    {selected && <GalleryViewer
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
