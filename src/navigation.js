export const SHORTCUT_OPTIONS = [
  { id: 'todo', label: '待辦', icon: '✓', page: '待辦事項' },
  { id: 'project', label: '專案', icon: '▣', page: '專案' },
  { id: 'prompt', label: '提示詞', icon: '✦', page: '提示詞' },
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

export const DEFAULT_SHORTCUTS = ['quick', 'project', 'prompt', 'appearance']

export function resolveShortcut(id) {
  return SHORTCUT_OPTIONS.find(item => item.id === id) || SHORTCUT_OPTIONS[0]
}