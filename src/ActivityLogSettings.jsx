import { useState } from 'react'
import { Clock3, Trash2 } from 'lucide-react'
import { clearActivity, recentActivity } from './activityService'
import Button from './ui/Button'
import Sheet from './ui/Sheet'

export default function ActivityLogSettings() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])

  async function showLog() {
    setItems(await recentActivity(100))
    setOpen(true)
  }

  async function clearLog() {
    if (!window.confirm('清除目前裝置上的專案活動紀錄？')) return
    await clearActivity()
    setItems([])
  }

  return <>
    <details className="settings-card setting-accordion">
      <summary>
        <div>
          <strong>系統紀錄</strong>
          <p>供同步與小周查閱，平常可以忽略。</p>
        </div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body activity-setting-body">
        <p className="activity-setting-note">
          只記錄專案被建立、修改、完成或恢復，不保存完整舊版本與圖片。
        </p>
        <Button variant="secondary" full icon={Clock3} onClick={showLog}>
          查看專案活動時間線
        </Button>
      </div>
    </details>

    {open && <Sheet title="專案活動時間線" onClose={() => setOpen(false)}>
      <div className="activity-log-toolbar">
        <span>最近 {items.length} 筆</span>
        <Button variant="danger" size="sm" icon={Trash2} onClick={clearLog}>
          清除
        </Button>
      </div>

      {items.length ? <div className="activity-log-list">
        {items.map(item => <article className="activity-log-item" key={item.id}>
          <div>
            <strong>{item.projectName}</strong>
            <time>{formatTime(item.createdAt)}</time>
          </div>
          <p>{item.summary}</p>
          <small>{item.actor || '手機'}</small>
        </article>)}
      </div> : <div className="activity-log-empty">
        <strong>目前沒有紀錄</strong>
        <p>之後修改專案時會自動留下輕量紀錄。</p>
      </div>}
    </Sheet>}
  </>
}

function formatTime(value) {
  return new Date(value).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
