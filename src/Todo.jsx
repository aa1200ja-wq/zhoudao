import { useState } from 'react'

export default function Todo({ items, onAdd, onUpdate, onDelete, onConvert }) {
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


function formatTime(value) {
  return new Date(value).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
