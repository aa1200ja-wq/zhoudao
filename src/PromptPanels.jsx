import { useState } from 'react'
import { SPECIAL_FILTERS } from './promptConfig'

export function PromptDetail({ item, folders, onClose, onEdit, onPatch }) {
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

export function PromptEditor({ item, folders, onClose, onSave }) {
  const [draft, setDraft] = useState({
    ...emptyPrompt(folders[0]),
    ...item,
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
  })

  async function chooseImage(file) {
    if (!file) return
    setDraft({ ...draft, image: await toDataUrl(file) })
  }

  return <Sheet title={draft.id ? '編輯圖庫資料' : '新增圖庫資料'} onClose={onClose}>
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
    >儲存資料</button>
  </Sheet>
}

export function FolderManager({ folders, onClose, onSave }) {
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

export function emptyPrompt(folder) {
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

export function labelForFilter(filter, folders) {
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