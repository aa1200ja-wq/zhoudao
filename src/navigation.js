export const SHORTCUT_OPTIONS = [
  { id: 'todo', label: '待辦', icon: '✓', page: '待辦事項' },
  { id: 'project', label: '專案', icon: '▣', page: '專案' },
  { id: 'prompt', label: '圖庫', icon: '✦', page: '圖庫' },
  { id: 'search', label: '搜尋', icon: '⌕', page: '全域搜尋' },
  { id: 'portfolio', label: '作品集', icon: '▤', page: '作品集' },
  { id: 'settings', label: '設定', icon: '⚙', page: '設定' },
  { id: 'quick', label: '快速記錄', icon: '＋', page: '待辦事項' },
  { id: 'appearance', label: '外觀', icon: '◐', page: '設定' },
]

export const RIGHT_ACTIONS = [
  { id: 'todo', label: '待辦事項', icon: '✓', page: '待辦事項' },
  { id: 'project', label: '專案', icon: '▣', page: '專案' },
  { id: 'prompt', label: '圖庫', icon: '✦', page: '圖庫' },
  { id: 'settings', label: '設定', icon: '⚙', page: '設定' },
]

export const BOTTOM_NAV_OPTIONS = [
  { id: 'todo', label: '待辦事項', page: '待辦事項' },
  { id: 'project', label: '專案', page: '專案' },
  { id: 'prompt', label: '圖庫', page: '圖庫' },
  { id: 'search', label: '搜尋', page: '全域搜尋' },
  { id: 'portfolio', label: '作品集', page: '作品集' },
  { id: 'settings', label: '設定', page: '設定' },
]

export const DEFAULT_SHORTCUTS = ['quick', 'project', 'prompt', 'appearance']
export const DEFAULT_BOTTOM_NAV = ['待辦事項', '專案', '圖庫', '全域搜尋', '作品集']

export function resolveShortcut(id) {
  return SHORTCUT_OPTIONS.find(item => item.id === id) || SHORTCUT_OPTIONS[0]
}

export function resolveBottomNav(page) {
  return BOTTOM_NAV_OPTIONS.find(item => item.page === page) || BOTTOM_NAV_OPTIONS[0]
}

export function normalizeBottomNav(items) {
  const valid = new Set(BOTTOM_NAV_OPTIONS.map(item => item.page))
  const next = []
  for (const item of items || []) {
    if (valid.has(item) && !next.includes(item)) next.push(item)
  }
  for (const item of DEFAULT_BOTTOM_NAV) {
    if (!next.includes(item)) next.push(item)
    if (next.length === 5) break
  }
  return next.slice(0, 5)
}
