const asset = name => import.meta.env.BASE_URL + 'demo/' + name

export const DEMO_HOME_IMAGE = asset('home.webp')
const VERTICAL = asset('vertical.webp')
const HORIZONTAL = asset('horizontal.webp')

export const demoPortfolio = [
  {
    id: 'demo-portfolio-1',
    title: '網站作品 A',
    url: 'https://example.com/demo-a',
    image: HORIZONTAL,
    demo: true,
  },
  {
    id: 'demo-portfolio-2',
    title: 'PWA 作品 B',
    url: 'https://example.com/demo-b',
    image: VERTICAL,
    demo: true,
  },
  {
    id: 'demo-portfolio-3',
    title: '互動頁面 C',
    url: 'https://example.com/demo-c',
    image: HORIZONTAL,
    demo: true,
  },
  {
    id: 'demo-portfolio-4',
    title: '工具作品 D',
    url: 'https://example.com/demo-d',
    image: VERTICAL,
    demo: true,
  },
]

export const demoGallery = [
  gallery('demo-gallery-1', '直式圖片測試 1', VERTICAL, '真人', ['直式', '測試']),
  gallery('demo-gallery-2', '橫式圖片測試 1', HORIZONTAL, '場景', ['橫式', '測試']),
  gallery('demo-gallery-3', '直式圖片測試 2', DEMO_HOME_IMAGE, '真人', ['直式', '人物']),
  gallery('demo-gallery-4', '直式圖片測試 3', VERTICAL, '情侶', ['直式', '雙人']),
  gallery('demo-gallery-5', '橫式圖片測試 2', HORIZONTAL, '商品', ['橫式', '參考']),
  gallery('demo-gallery-6', '直式圖片測試 4', DEMO_HOME_IMAGE, '未整理', ['直式', '未整理']),
]

function gallery(id, title, image, folder, tags) {
  return {
    id,
    title,
    type: 'Prompt',
    content: '手機版圖庫版型測試用 Prompt。',
    note: '暫時測試圖片，之後可直接刪除或替換。',
    tags,
    image,
    folder,
    favorite: false,
    verified: false,
    demo: true,
    updatedAt: Date.now(),
  }
}
