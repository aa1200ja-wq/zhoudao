import { useState } from 'react'
import { Check, MoreHorizontal, Plus } from 'lucide-react'
import Button from './ui/Button'

export default function Todo({ items, onAdd, onUpdate, onDelete, onConvert }) {
  const [text, setText] = useState('')
  const [tab, setTab] = useState('today')
  const [menuId, setMenuId] = useState(null)
  const today = dateKey()

  const normalized = items.map(item => ({
    ...item,
    pinned: Boolean(item.pinned),
    completedToday: isCompletedToday(item, today),
    skippedToday: isSkippedToday(item, today),
  }))

  const visible = normalized
    .filter(item => {
      if (tab === 'completed') return item.completedToday
      if (tab === 'skipped') return item.skippedToday
      return !item.completedToday && !item.skippedToday
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)

  const counts = {
    today: normalized.filter(item => !item.completedToday && !item.skippedToday).length,
    skipped: normalized.filter(item => item.skippedToday).length,
    completed: normalized.filter(item => item.completedToday).length,
  }

  function complete(item) {
    onUpdate(item, {
      completed: true,
      completedDate: today,
      skippedDate: '',
      bucket: 'today',
    })
  }

  function skipToday(item) {
    onUpdate(item, {
      completed: false,
      completedDate: '',
      skippedDate: today,
      bucket: 'today',
    })
  }

  function restoreToday(item) {
    onUpdate(item, {
      completed: false,
      completedDate: '',
      skippedDate: '',
      bucket: 'today',
    })
  }

  return <div className="todo-page">
    <div className="composer todo-composer">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="新增每天都要提醒自己的事…"
      />
      <Button variant="primary" full icon={Plus} onClick={() => {
        onAdd(text)
        setText('')
        setTab('today')
      }}>新增每日事項</Button>
    </div>

    <div className="todo-tabs">
      <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
        今天 <span>{counts.today}</span>
      </button>
      <button className={tab === 'skipped' ? 'active' : ''} onClick={() => setTab('skipped')}>
        今天不用 <span>{counts.skipped}</span>
      </button>
      <button className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>
        完成 <span>{counts.completed}</span>
      </button>
    </div>

    {visible.length ? <div className="todo-list">
      {visible.map(item => <article
        className={'todo-item ' + (item.completedToday ? 'done' : '')}
        key={item.id}
      >
        <button
          className={'todo-check ' + (item.completedToday ? 'checked' : '')}
          onClick={() => item.completedToday ? restoreToday(item) : complete(item)}
          aria-label={item.completedToday ? '恢復到今天' : '標記今天完成'}
        >{item.completedToday && <Check aria-hidden="true" />}</button>

        <button className="todo-main" onClick={() => setMenuId(menuId === item.id ? null : item.id)}>
          <div className="todo-text-row">
            <p>{item.text}</p>
            {item.pinned && <span className="todo-pin">置頂</span>}
          </div>
          <small>{item.completedToday ? '今天已完成' : item.skippedToday ? '今天不用' : '每日事項'}</small>
        </button>

        <button
          className="todo-more"
          onClick={() => setMenuId(menuId === item.id ? null : item.id)}
          aria-label="更多操作"
        ><MoreHorizontal aria-hidden="true" /></button>

        {menuId === item.id && <div className="todo-menu">
          {!item.completedToday && !item.skippedToday && <button onClick={() => {
            skipToday(item)
            setMenuId(null)
          }}>今天不用</button>}
          {(item.completedToday || item.skippedToday) && <button onClick={() => {
            restoreToday(item)
            setMenuId(null)
          }}>恢復到今天</button>}
          <button onClick={() => {
            onUpdate(item, { pinned: !item.pinned })
            setMenuId(null)
          }}>{item.pinned ? '取消置頂' : '置頂'}</button>
          {!item.completedToday && <button onClick={() => {
            onConvert(item)
            setMenuId(null)
          }}>轉成專案</button>}
          <button className="danger" onClick={() => {
            onDelete(item.id)
            setMenuId(null)
          }}>刪除每日事項</button>
        </div>}
      </article>)}
    </div> : <div className="todo-empty">
      <strong>{emptyTitle(tab)}</strong>
      <p>{tab === 'today' ? '今天的每日事項都處理完了。' : '隔天會自動重新回到「今天」。'}</p>
    </div>}
  </div>
}

function isCompletedToday(item, today) {
  if (item.completedDate) return item.completedDate === today
  return Boolean(item.completed) && dateKey(item.updatedAt) === today
}

function isSkippedToday(item, today) {
  if (item.skippedDate) return item.skippedDate === today
  return item.bucket === 'later' && dateKey(item.updatedAt) === today
}

function dateKey(value = Date.now()) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function emptyTitle(tab) {
  if (tab === 'skipped') return '今天沒有略過項目'
  if (tab === 'completed') return '今天還沒有完成項目'
  return '今天沒有待辦'
}
