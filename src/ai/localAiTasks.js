import { generate, isModelReady } from './localAiRuntime'
import { buildLocalAiContext, formatLocalAiContext } from './localAiContext'

const SYSTEM = '你是周到 PWA 裡的本機小型 AI。使用台灣繁體中文，回答精簡，不要捏造未提供的事實。'

export async function generateHomeDialogue(extra = {}) {
  const context = await buildLocalAiContext(extra)
  const prompt = [
    '你現在可以看到周到裡的真實工作資料。',
    '請先讀完「目前專案、我的草稿、專案流程表、目前步驟、下一步、待辦、最近變更」。',
    '再產生 4 句彼此不同的首頁助理短台詞。',
    '至少 2 句必須明確引用資料中的具體專案、步驟、草稿內容或待辦，不可以全部只講一般問候或鼓勵。',
    '每句 12～38 個中文字，自然、簡短，不要編號，不要捏造資料。',
    '',
    formatLocalAiContext(context),
  ].join('\n')

  const output = await run(prompt, { maxTokens: 190, temperature: .72 })
  const lines = output
    .split('\n')
    .map(line => line.replace(/^[-*\d.、)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 4)

  return lines.length ? lines : []
}

export async function classifyCapture(text) {
  const output = await run([
    '判斷以下文字最適合放在哪一類，只能從：待辦、專案、圖庫、筆記 選一個。',
    '並產生一個 18 字內短標題。',
    '輸出格式固定兩行：',
    '類型：',
    '標題：',
    '',
    text,
  ].join('\n'), { maxTokens: 70, temperature: .2 })

  return {
    type: pick(output, '類型') || '筆記',
    title: pick(output, '標題') || text.slice(0, 18),
  }
}

export async function summarizeText(text) {
  return run([
    '把以下文字濃縮成一段 60 字內摘要，只保留重要資訊，不增加新內容：',
    '',
    text,
  ].join('\n'), { maxTokens: 90, temperature: .2 })
}

export async function suggestTags(text) {
  const output = await run([
    '根據以下內容產生 3～5 個繁體中文短標籤。',
    '只輸出逗號分隔標籤，不要說明，不要加 #。',
    '',
    text,
  ].join('\n'), { maxTokens: 60, temperature: .25 })

  return output
    .replace(/[。；;\n]/g, ',')
    .split(',')
    .map(tag => tag.trim().replace(/^#/, ''))
    .filter(Boolean)
    .slice(0, 5)
}

export async function organizeProjectDraft(text) {
  const output = await run([
    '把以下專案雜記整理成三項。只能使用原文資訊，不確定就留空。',
    '輸出格式固定三行：',
    '目前步驟：',
    '本次要做：',
    '下一步：',
    '',
    text,
  ].join('\n'), { maxTokens: 130, temperature: .2 })

  return {
    current: pick(output, '目前步驟'),
    currentTask: pick(output, '本次要做'),
    next: pick(output, '下一步'),
  }
}

export async function suggestGalleryMeta({ title, content, note, folder }) {
  const source = [title, content, note, folder].filter(Boolean).join('\n')
  const tags = await suggestTags(source)
  let nextTitle = title

  if (!nextTitle?.trim()) {
    const output = await run([
      '替以下內容產生 16 字內繁體中文名稱，只輸出名稱：',
      '',
      source,
    ].join('\n'), { maxTokens: 40, temperature: .3 })
    nextTitle = output.split('\n')[0]?.trim() || ''
  }

  return { title: nextTitle, tags }
}

export async function answerWorkspaceQuestion(question) {
  const context = await buildLocalAiContext()
  const prompt = [
    '請只根據下面的周到資料回答問題。',
    '如果資料裡沒有答案，就直接說「目前資料裡沒有」。不要猜。',
    '',
    formatLocalAiContext(context),
    '',
    '【問題】',
    question || '請告訴我目前最重要的專案進度與未完成待辦。',
  ].join('\n')

  return run(prompt, { maxTokens: 180, temperature: .25 })
}

export async function summarizeWorkspace() {
  return answerWorkspaceQuestion(
    '用 4 點以內告訴我：目前主要專案做到哪、本次要做什麼、下一步是什麼、今天有哪些未完成待辦。',
  )
}

export async function testLocalAi() {
  const output = await run('只回答：周到本機 AI 正常', {
    maxTokens: 20,
    temperature: 0,
  })
  return output
}

async function run(userContent, options) {
  if (!isModelReady()) throw new Error('請先到設定啟動本機 AI')
  return generate([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: userContent },
  ], options)
}

function pick(output, label) {
  const line = output
    .split('\n')
    .find(item => item.trim().startsWith(label + '：') || item.trim().startsWith(label + ':'))
  return line ? line.replace(new RegExp('^\\s*' + label + '[：:]\\s*'), '').trim() : ''
}
