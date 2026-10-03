import { generate, isModelReady } from './localAiRuntime'

const SYSTEM = [
  '你是周到首頁的小助手。',
  '只做一件事：把一個很簡單的提示改寫成一句自然、簡短的繁體中文台詞。',
  '不要分析、不要列點、不要解釋、不要新增不存在的資訊。',
].join('')

export async function generateHomeLine({ type, fact = '', timeOfDay = '現在', lastLine = '' }) {
  const task = buildTask(type, fact, timeOfDay, lastLine)
  const output = await run(task, { maxTokens: 48, temperature: .88 })
  return cleanLine(output)
}

export async function testLocalAi() {
  const output = await run('只回答：周到本機 AI 正常', {
    maxTokens: 20,
    temperature: 0,
  })
  return output
}

function buildTask(type, fact, timeOfDay, lastLine) {
  const avoid = lastLine ? '不要重複上一句：「' + lastLine + '」。' : ''

  if (type === 'project') {
    return [
      '把下面這個專案資訊改寫成一句自然提醒。',
      '只說這個資訊，不延伸。',
      fact,
      avoid,
    ].filter(Boolean).join('\n')
  }

  if (type === 'todo') {
    return [
      '把下面這個待辦改寫成一句自然提醒。',
      '語氣像熟悉的助理，不要說教。',
      fact,
      avoid,
    ].filter(Boolean).join('\n')
  }

  return [
    '現在是' + timeOfDay + '。',
    '請隨機說一句 8～22 字的自然問候、打氣或輕鬆短句。',
    '不要提不存在的工作內容。',
    avoid,
  ].filter(Boolean).join('\n')
}

async function run(userContent, options) {
  if (!isModelReady()) throw new Error('請先到設定啟動本機 AI')
  return generate([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: userContent },
  ], options)
}

function cleanLine(output) {
  const first = String(output || '')
    .split('\n')
    .map(line => line.replace(/^[-*\d.、)\s]+/, '').trim())
    .find(Boolean)

  return (first || '').replace(/^["「『]|["」』]$/g, '').trim()
}
