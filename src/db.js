import Dexie from 'dexie'
import { starterProjects, starterPrompts } from './data'
import { DEFAULT_SHORTCUTS } from './navigation'
import { DEFAULT_ASSISTANT } from './assistantConfig'

export const db = new Dexie('zhoudao-db')

db.version(1).stores({
  projects: 'id, status, updatedAt',
  library: 'id, type, updatedAt',
  inbox: '++id, updatedAt, synced',
  settings: 'key',
})

db.version(2).stores({
  projects: 'id, status, updatedAt',
  library: 'id, type, updatedAt',
  inbox: '++id, updatedAt, synced',
  settings: 'key',
  portfolio: 'id, updatedAt',
})

export async function seedDb() {
  if ((await db.projects.count()) === 0) await db.projects.bulkAdd(starterProjects)
  if ((await db.library.count()) === 0) await db.library.bulkAdd(starterPrompts)
  if (!(await db.settings.get('assistant'))) {
    await db.settings.put(DEFAULT_ASSISTANT)
  }
  if (!(await db.settings.get('preferences'))) {
    await db.settings.put({
      key: 'preferences',
      darkMode: false,
      homeBackground: 'cream',
      backgroundImage: '',
      shortcuts: DEFAULT_SHORTCUTS,
      mobilePreview: false,
    })
  }
}

export async function pendingCount() {
  const inbox = await db.inbox.where('synced').equals(0).count()
  const settings = await db.settings.get('syncState')
  return inbox + (settings?.dirtyCount || 0)
}

export async function markDirty() {
  const state = await db.settings.get('syncState')
  await db.settings.put({
    key: 'syncState',
    dirtyCount: (state?.dirtyCount || 0) + 1,
    updatedAt: Date.now(),
  })
}