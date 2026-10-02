export const SHORTCUT_OPTIONS = [
  { id: 'todo', label: '待辦', icon: '✓', page: '待辦事項' },
  { id: 'project', label: '專案', icon: '▣', page: '專案' },
  { id: 'prompt', label: '提示詞', icon: '✦', page: '提示詞' },
  { id: 'search', label: '搜尋', icon: '⌕', page: '全域搜尋' },
  { id: 'settings', label: '設定', icon: '⚙', page: '設定' },
  { id: 'quick', label: '快速記錄', icon: '＋', page: '待辦事項' },
  { id: 'appearance', label: '外觀', icon: '◐', page: '設定' },
]

export const RIGHT_ACTIONS = [
  { id: 'todo', label: '待辦事項', icon: '✓', page: '待辦事項' },
  { id: 'project', label: '專案', icon: '▣', page: '專案' },
  { id: 'prompt', label: '提示詞', icon: '✦', page: '提示詞' },
  { id: 'settings', label: '設定', icon: '⚙', page: '設定' },
]

export const BOTTOM_NAV_OPTIONS = [
  { id: 'home', label: '首頁', page: '首頁' },
  { id: 'todo', label: '待辦事項', page: '待辦事項' },
  { id: 'project', label: '專案', page: '專案' },
  { id: 'prompt', label: '提示詞', page: '提示詞' },
  { id: 'search', label: '搜尋', page: '全域搜尋' },
  { id: 'settings', label: '設定', page: '設定' },
]

export const DEFAULT_SHORTCUTS = ['quick', 'project', 'prompt', 'appearance']
export const DEFAULT_BOTTOM_NAV = ['首頁', '待辦事項', '專案', '提示詞', '全域搜尋']

export function resolveShortcut(id) {
  return SHORTCUT_OPTIONS.find(item => item.id === id) || SHORTCUT_OPTIONS[0]
}

export function resolveBottomNav(page) {
  return BOTTOM_NAV_OPTIONS.find(item => item.page === page) || BOTTOM_NAV_OPTIONS[0]
}