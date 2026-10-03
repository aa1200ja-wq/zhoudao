import { db } from './db'

const TABLES = ['projects', 'library', 'inbox', 'settings', 'portfolio', 'activity']

export async function exportLocalBackup() {
  const data = {
    app: 'zhoudao',
    formatVersion: 2,
    exportedAt: new Date().toISOString(),
    tables: {},
  }

  for (const name of TABLES) {
    data.tables[name] = await db.table(name).toArray()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'zhoudao-backup-' + dateStamp() + '.json'
  link.click()
  URL.revokeObjectURL(url)
}

export async function importLocalBackup(file) {
  const data = JSON.parse(await file.text())

  if (data?.app !== 'zhoudao' || !data?.tables) {
    throw new Error('不是有效的周到備份檔。')
  }

  await db.transaction(
    'rw',
    db.projects,
    db.library,
    db.inbox,
    db.settings,
    db.portfolio,
    db.activity,
    async () => {
      for (const name of TABLES) {
        const table = db.table(name)
        await table.clear()
        const rows = data.tables[name]
        if (Array.isArray(rows) && rows.length) {
          await table.bulkPut(rows)
        }
      }
    },
  )
}

export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) return null
  const estimate = await navigator.storage.estimate()
  return {
    usage: estimate.usage || 0,
    quota: estimate.quota || 0,
  }
}

export function formatBytes(bytes) {
  if (!bytes) return '0 MB'
  return (bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0) + ' MB'
}

function dateStamp() {
  const now = new Date()
  const pad = value => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
  ].join('')
}
