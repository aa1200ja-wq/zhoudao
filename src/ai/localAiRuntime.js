const WEBLLM_URL = 'https://esm.run/@mlc-ai/web-llm'
export const GPU_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'
export const CPU_MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct'

let moduleRef = null
let gpuEngine = null
let gpuWorker = null
let cpuWorker = null
let backend = null
let cpuLoad = null
let cpuChat = null
const listeners = new Set()

let state = {
  status: 'idle',
  progress: 0,
  message: 'AI 尚未啟動',
  backend: preferredBackend(),
}

export function preferredBackend() {
  return navigator.gpu ? 'webgpu' : 'wasm'
}

export function getAiState() {
  return { ...state, ready: isModelReady() }
}

export function subscribeAi(listener) {
  listeners.add(listener)
  listener(getAiState())
  return () => listeners.delete(listener)
}

export function wasModelLoadedBefore() {
  return localStorage.getItem('zhoudao:model-ever-loaded') === '1'
}

export function getStoredBackend() {
  return localStorage.getItem('zhoudao:last-backend') || ''
}

export function getModelProfile() {
  const mode = backend || preferredBackend()
  return mode === 'webgpu'
    ? { mode: 'WebGPU', quant: 'Q4F16', download: '約 290MB' }
    : { mode: 'CPU / WASM', quant: 'Q8', download: '約 520MB' }
}

async function getWebLLM() {
  if (!moduleRef) moduleRef = await import(/* @vite-ignore */ WEBLLM_URL)
  return moduleRef
}

function setState(patch) {
  state = { ...state, ...patch }
  const snapshot = getAiState()
  listeners.forEach(listener => listener(snapshot))
}

function workerUrl(file) {
  return import.meta.env.BASE_URL + 'ai/' + file
}

function waitForWorkerReady(worker, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(label + ' 啟動逾時，請重新載入 App 後再試。'))
    }, 20000)

    function onMessage(event) {
      if (event.data?.type !== 'zhoudao-worker-ready') return
      cleanup()
      resolve(true)
    }

    function onError(event) {
      cleanup()
      reject(new Error(label + ' 載入失敗：' + (event.message || '未知錯誤')))
    }

    function cleanup() {
      clearTimeout(timer)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
  })
}

async function setupCpuWorker() {
  setState({ message: '啟動 CPU/WASM Worker…' })
  cpuWorker = new Worker(workerUrl('cpu-worker.js'), { type: 'module' })
  const ready = waitForWorkerReady(cpuWorker, 'CPU/WASM Worker')
  cpuWorker.onmessage = ({ data }) => {
    if (data.type === 'progress') {
      const raw = Number(data.report?.progress ?? 0)
      const progress = raw > 1 ? raw / 100 : raw
      setState({ progress: Number.isFinite(progress) ? progress : 0, message: cpuProgressText(data.report) })
    }
    if (data.type === 'ready') {
      backend = 'wasm'
      cpuLoad?.resolve(true)
      cpuLoad = null
    }
    if (data.type === 'result') {
      cpuChat?.resolve(data.output || '')
      cpuChat = null
    }
    if (data.type === 'error') {
      const error = new Error(data.message || 'CPU/WASM 模型錯誤')
      if (cpuLoad) { cpuLoad.reject(error); cpuLoad = null }
      if (cpuChat) { cpuChat.reject(error); cpuChat = null }
    }
  }
  await ready
}

function cpuProgressText(report) {
  const file = report?.file?.split('/').pop() || '模型'
  const raw = Number(report?.progress ?? 0)
  const pct = Math.round((raw > 1 ? raw / 100 : raw) * 100)
  if (report?.status === 'progress') return `下載 ${file} ${pct}%`
  if (report?.status === 'done') return `${file} 已完成`
  if (report?.status === 'ready') return 'CPU/WASM 模型已就緒'
  return report?.status || '準備 CPU/WASM 模型…'
}

async function loadCpuModel() {
  if (cpuWorker && backend === 'wasm') return true
  if (!cpuWorker) await setupCpuWorker()
  setState({ message: '載入 Qwen CPU/WASM 模型…' })
  return new Promise((resolve, reject) => {
    cpuLoad = { resolve, reject }
    cpuWorker.postMessage({ type: 'load' })
  })
}

async function loadGpuModel() {
  if (gpuEngine) return gpuEngine
  setState({ message: '載入 WebLLM 核心…' })
  const webllm = await getWebLLM()
  setState({ message: '啟動 GPU Worker…' })
  gpuWorker = new Worker(workerUrl('gpu-worker.js'), { type: 'module' })
  await waitForWorkerReady(gpuWorker, 'GPU Worker')
  setState({ message: '建立 Qwen WebGPU 引擎…' })
  const appConfig = { ...webllm.prebuiltAppConfig, cacheBackend: 'cache' }
  gpuEngine = await webllm.CreateWebWorkerMLCEngine(gpuWorker, GPU_MODEL_ID, {
    appConfig,
    initProgressCallback: report => setState({
      progress: Number(report.progress ?? 0),
      message: report.text || '下載／載入模型…',
    }),
  })
  backend = 'webgpu'
  return gpuEngine
}

export async function loadModel() {
  if (isModelReady()) return true
  setState({ status: 'loading', progress: .01, message: '準備本機 AI…' })
  try {
    const mode = preferredBackend()
    if (mode === 'webgpu') await loadGpuModel()
    else await loadCpuModel()
    localStorage.setItem('zhoudao:model-ever-loaded', '1')
    localStorage.setItem('zhoudao:last-backend', mode)
    setState({ status: 'ready', progress: 1, backend: mode, message: 'Qwen 已就緒' })
    return true
  } catch (error) {
    setState({ status: 'error', progress: 0, message: error?.message || String(error) })
    throw error
  }
}

export function isModelReady() {
  return Boolean(gpuEngine || (cpuWorker && backend === 'wasm'))
}

export async function unloadModel() {
  if (gpuEngine) await gpuEngine.unload()
  gpuWorker?.terminate()
  cpuWorker?.terminate()
  gpuEngine = null
  gpuWorker = null
  cpuWorker = null
  cpuLoad = null
  cpuChat = null
  backend = null
  setState({ status: 'idle', progress: 0, backend: preferredBackend(), message: '模型仍保存在手機，已卸載 RAM' })
}

export async function generate(messages, options = {}) {
  if (!isModelReady()) throw new Error('本機 AI 尚未啟動')
  const temperature = options.temperature ?? .65
  const maxTokens = options.maxTokens ?? 120
  if (backend === 'wasm') {
    return new Promise((resolve, reject) => {
      cpuChat = { resolve, reject }
      cpuWorker.postMessage({ type: 'generate', messages, temperature, maxTokens })
    })
  }

  const result = await gpuEngine.chat.completions.create({
    messages,
    stream: false,
    temperature,
    max_tokens: maxTokens,
  })
  return result.choices?.[0]?.message?.content?.trim() || ''
}
