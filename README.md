# 周到｜小助手

個人使用的 Local-first PWA，先解決「專案做到哪、下一步是什麼、Prompt／素材放哪裡」的續接問題。

## MVP 現況

- 首頁小助手形象，可自行換圖
- 點小助手會顯示專案下一步
- 專案新增／編輯，以底部彈出卡片操作
- 收件匣快速記錄想法
- Prompt／素材可保存圖片、文字與標籤
- IndexedDB 本機儲存
- 待同步數量
- GitHub 同步按鈕目前僅保留介面，尚未接正式 API
- PWA 基礎設定已加入

## 本機啟動

~~~bash
git clone https://github.com/aa1200ja-wq/zhoudao.git
cd zhoudao
npm install
npm run dev
~~~

瀏覽器開啟 Vite 顯示的 localhost 網址即可。

## 正式資料流（後續）

手機 PWA → IndexedDB 本機儲存 → 手動按「同步 GitHub」→ Vercel 安全 API → Private GitHub 資料庫。

目前不接 Vercel，也不放 GitHub Token。
