import { generate, isModelReady } from './localAiRuntime'

const SYSTEM = '你是周到 PWA 裡的本機小型 AI。使用台灣繁體中文，回答精簡，不要捏造未提供的事實。'

export async function generateHomeDialogue(context) {
  const prompt = [
    '請根據以下真實資料，產生 4 句彼此不同的首頁助理短台詞。',
    '規則：每句 12～32 個中文字；自然、像熟悉使用者的助理；可問候、提醒、鼓勵或提到目前工作。',
    '禁止編造不存在的專案或待辦。不要編號，每行一句。',
    '',
    contextText(context),
  ].join('\n')

  const output = await run(prompt, { maxTokens: 150, temperature: .82 })
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

function contextText(context) {
  const project = context.project
  const todos = (context.todos || []).slice(0, 5)
  return [
    '時間：' + (context.timeOfDay || '現在'),
    '助理名稱：' + (context.assistantName || '小周'),
    project ? '目前專案：' + project.name : '目前專案：無',
    project?.current ? '目前步驟：' + project.current : '',
    project?.currentTask ? '本次要做：' + project.currentTask : '',
    project?.next ? '下一步：' + project.next : '',
    todos.length ? '今天未完成：' + todos.map(item => item.text).join('、') : '今天未完成：無',
    context.pending ? '待同步：' + context.pending + ' 項' : '',
  ].filter(Boolean).join('\n')
}
