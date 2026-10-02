export default function GalleryViewer({
  item,
  folders,
  onClose,
  onEdit,
  onPatch,
}) {
  async function copyPrompt() {
    await navigator.clipboard.writeText(item.content || '')
  }

  return <div className="overlay gallery-overlay" onMouseDown={onClose}>
    <section className="gallery-viewer" onMouseDown={e => e.stopPropagation()}>
      <header className="gallery-viewer-header">
        <div>
          <small>{item.folder || '未整理'}</small>
          <h2>{item.title}</h2>
        </div>
        <button className="icon" onClick={onClose} aria-label="關閉">×</button>
      </header>

      <div className={'gallery-image-stage ' + (!item.image ? 'no-image' : '')}>
        {item.image
          ? <img src={item.image} alt={item.title} />
          : <div className="gallery-no-image"><span>✦</span><p>這筆資料尚未加入圖片</p></div>}
      </div>

      <details className="gallery-details">
        <summary>
          <span>詳細資料</span>
          <span className="accordion-chevron">⌄</span>
        </summary>
        <div className="gallery-details-body">
          <div className="prompt-detail-meta">
            <span>{item.folder || '未整理'}</span>
            <div>
              <button
                className={item.favorite ? 'active' : ''}
                onClick={() => onPatch({ favorite: !item.favorite })}
              >☆ 收藏</button>
              <button
                className={item.verified ? 'active' : ''}
                onClick={() => onPatch({ verified: !item.verified })}
              >✓ 已驗證</button>
            </div>
          </div>

          <div className="prompt-detail-tags">
            {(item.tags || []).map(tag => <em key={tag}>#{tag}</em>)}
          </div>

          <div className="prompt-copy-block">
            <small>PROMPT</small>
            <p>{item.content || '尚未填寫提示詞內容。'}</p>
          </div>

          {item.note && <div className="prompt-note">
            <small>備註</small>
            <p>{item.note}</p>
          </div>}

          <div className="prompt-detail-actions">
            <button className="secondary" onClick={onEdit}>編輯</button>
            <button className="primary" onClick={copyPrompt}>複製 Prompt</button>
          </div>

          <label className="prompt-move">
            <span>移到資料夾</span>
            <select
              value={item.folder || '未整理'}
              onChange={e => onPatch({ folder: e.target.value })}
            >
              <option value="未整理">未整理</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </label>
        </div>
      </details>
    </section>
  </div>
}
