import { DEFAULT_BOTTOM_NAV, DEFAULT_SHORTCUTS } from './navigation'

export const EMPTY_PROJECT = {
  name: '',
  status: '進行中',
  progress: 0,
  current: '',
  next: '',
  draft: '',
  flowText: '',
  currentStepDetail: '',
  currentTask: '',
  nextDetail: '',
  architectureText: '',
  changelogText: '',
}

export const DEFAULT_PREFS = {
  darkMode: false,
  homeBackground: 'cream',
  backgroundImage: '',
  shortcuts: DEFAULT_SHORTCUTS,
  mobilePreview: false,
  promptFolders: ['真人', '情侶', '商品', '場景', '影片'],
  bottomNav: DEFAULT_BOTTOM_NAV,
}
