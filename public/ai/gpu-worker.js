import { WebWorkerMLCEngineHandler } from 'https://esm.run/@mlc-ai/web-llm'

const handler = new WebWorkerMLCEngineHandler()
self.postMessage({ type: 'zhoudao-worker-ready' })
self.onmessage = event => handler.onmessage(event)
