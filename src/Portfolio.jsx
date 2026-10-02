import { useState } from 'react'

export default function Portfolio({ items, onSave, onDelete }) {
  const [editing, setEditing] = useState(null)

  return <div className="portfolio-page">
    <div className="portfolio-toolbar">
      <div>
        <strong>已上線作品</strong>
        <p>PWA、網站或其他可直接開啟的連結。</p>
      </div>
      <button onClick={() => setEditing(emptyItem())}>＋ 新增</button>
    </div>

    {items.length ? <div className="portfolio-grid">
      {items.map(item => <article className="portfolio-card" key={item.id}>
        <button className="portfolio-open" onClick={() => openUrl(item.url)}>
          <div className={'portfolio-thumb ' + (!item.image ? 'no-image' : '')}>
            {item.image ? <img src={item.image} alt={item.title} /> : <span>▤</span>}
          </div>
          <div className="portfolio-copy">
            <strong>{item.title}</strong>
            <small>{item.url}</small>
          </div>
        </button>
        <div className="portfolio-actions">
          <button onClick={() => setEditing(item)}>編輯</button>
          <button className="danger" onClick={() => onDelete(item.id)}>刪除</button>
        </div>
      </article>)}
    </div> : <div className="portfolio-empty">
      <span>▤</span>
      <strong>還沒有作品</strong>
      <p>把已上線的 PWA 或網站加進來，之後可以直接點開。</p>
    </div>}

    {editing && <PortfolioEditor
      item={editing}
      onClose={() => setEditing(null)}
      onSave={async item => {
        await onSave(item)
        setEditing(null)
      }}
    />}
  </div>
}

function PortfolioEditor({ item, onClose, onSave }) {
  const [draft, setDraft] = useState(item)

  async function chooseImage(file) {
    if (!file) return
    setDraft({ ...draft, image: await toDataUrl(file) })
  }

  return <div className="overlay" onMouseDown={onClose}>
    <div className="modal" onMouseDown={e => e.stopPropagation()}>
      <div className="row"><h2>{draft.id ? '編輯作品' : '新增作品'}</h2><button className="icon" onClick={onClose}>×</button></div>
      <label>名稱<input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
      <label>網址<input value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} placeholder="https://..." /></label>
      <label className="upload">選擇縮圖<input type="file" accept="image/*" onChange={e => chooseImage(e.target.files?.[0])} /></label>
      {draft.image && <img className="preview" src={draft.image} alt="作品縮圖預覽" />}
      <button
        className="primary full"
        disabled={!draft.title.trim() || !draft.url.trim()}
        onClick={() => onSave({ ...draft, url: normalizeUrl(draft.url) })}
      >儲存作品</button>
    </div>
  </div>
}

function emptyItem() {
  return { title: '', url: '', image: '' }
}

function normalizeUrl(url) {
  const value = url.trim()
  return /^https?:\/\//i.test(value) ? value : 'https://' + value
}

function openUrl(url) {
  window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer')
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}