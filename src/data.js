export const starterProjects = [
  {
    id: 'renwoxing',
    name: '任我行網站',
    status: '進行中',
    progress: 70,
    current: '人物頁與主要內容完成',
    next: '修正內頁換頁動畫',
    draft: '先確認換頁動效，再處理 YouTube 與右鍵選單。',
    updatedAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'jiuhaojian',
    name: '揪好剪',
    status: '進行中',
    progress: 45,
    current: '素材剪輯設定 UI',
    next: '完成影片時間軸預覽與錯誤處理',
    draft: '操作要像 iPhone 剪片，左右拖曳選時間段。',
    updatedAt: Date.now() - 1000 * 60 * 60 * 10,
  },
]

export const starterPrompts = [
  {
    id: 'prompt-selfie-v4',
    title: '雙人自拍 V4',
    type: 'Prompt',
    tags: ['雙人', '自拍', '真人感'],
    content: '雙人臉部權重平均，保留真實皮膚、自然光線與手機隨手拍質感。',
    updatedAt: Date.now() - 1000 * 60 * 60 * 20,
  },
]