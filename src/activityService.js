import { db } from './db'

const MAX_ACTIVITY = 800
const TRACKED_FIELDS = {
  name: '項目名稱',
  status: '狀態',
  progress: '進度',
  current: '目前步驟',
  currentStepDetail: '目前步驟詳細',
  currentTask: '本次要做',
  next: '下一步',
  nextDetail: '下一步詳細',
  draft: '我的草稿',
  flowText: '專案流程表',
  architectureText: '專案架構',
  changelogText: '版本紀錄',
}

export async function recordProjectActivity(previous, next, action = 'update') {
  if (!next?.id) return

  const fields = changedFields(previous, next)
  const summary = buildSummary(action, fields)

  await db.activity.add({
    projectId: next.id,
    projectName: next.name || '未命名專案',
    actor: '手機',
    action,
    fields,
    summary,
    createdAt: Date.now(),
  })

  await trimActivity()
}

export async function recentActivity(limit = 100) {
  return db.activity.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function clearActivity() {
  await db.activity.clear()
}

function changedFields(previous, next) {
  if (!previous) return ['建立']
  return Object.entries(TRACKED_FIELDS)
    .filter(([key]) => normalize(previous[key]) !== normalize(next[key]))
    .map(([, label]) => label)
}

function buildSummary(action, fields) {
  if (action === 'create') return '建立專案'
  if (action === 'archive') return '標記完成並封存'
  if (action === 'restore') return '恢復為進行中'
  if (!fields.length) return '儲存專案'
  return '修改：' + fields.slice(0, 5).join('、') + (fields.length > 5 ? '…' : '')
}

function normalize(value) {
  return value == null ? '' : String(value)
}

async function trimActivity() {
  const count = await db.activity.count()
  const excess = count - MAX_ACTIVITY
  if (excess <= 0) return

  const ids = await db.activity.orderBy('createdAt').limit(excess).primaryKeys()
  await db.activity.bulkDelete(ids)
}
