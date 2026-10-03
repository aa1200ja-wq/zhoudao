import { getStoredBackend, wasModelLoadedBefore } from './localAiRuntime'

function classifyUrl(rawUrl) {
  let url = rawUrl
  try { url = decodeURIComponent(rawUrl) } catch (_) {}
  if (url.includes('mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC')) return 'gpu'
  if (url.includes('onnx-community/Qwen2.5-0.5B-Instruct')) return 'cpu'
  return null
}

export async function scanModelInventory() {
  const result = {
    gpu: { installed: false, partial: false, entries: 0, weightEntries: 0 },
    cpu: { installed: false, partial: false, entries: 0, weightEntries: 0 },
    duplicates: 0,
    packageCount: 0,
    cacheCount: 0,
  }

  if (!('caches' in window)) return result
  const names = await caches.keys()
  result.cacheCount = names.length
  const locations = new Map()

  for (const name of names) {
    const cache = await caches.open(name)
    const requests = await cache.keys()
    for (const request of requests) {
      let decoded = request.url
      try { decoded = decodeURIComponent(request.url) } catch (_) {}
      const type = classifyUrl(decoded)
      if (!type) continue

      result[type].entries += 1
      const found = locations.get(decoded) || new Set()
      found.add(name)
      locations.set(decoded, found)

      if (type === 'gpu' && (decoded.includes('params_shard') || decoded.endsWith('.bin'))) {
        result.gpu.weightEntries += 1
      }
      if (type === 'cpu' && /\/onnx\/model[^/]*\.onnx(?:\?|$)/i.test(decoded)) {
        result.cpu.weightEntries += 1
      }
    }
  }

  result.gpu.installed = result.gpu.weightEntries > 0
    || (getStoredBackend() === 'webgpu' && wasModelLoadedBefore())
  result.cpu.installed = result.cpu.weightEntries > 0
  result.gpu.partial = result.gpu.entries > 0 && !result.gpu.installed
  result.cpu.partial = result.cpu.entries > 0 && !result.cpu.installed
  result.duplicates = [...locations.values()].filter(set => set.size > 1).length
  result.packageCount = Number(result.gpu.installed) + Number(result.cpu.installed)
  return result
}

export async function clearKnownModelCaches(type = 'all') {
  if (!('caches' in window)) return 0
  let deleted = 0
  for (const name of await caches.keys()) {
    const cache = await caches.open(name)
    for (const request of await cache.keys()) {
      const kind = classifyUrl(request.url)
      if (!kind || (type !== 'all' && type !== kind)) continue
      if (await cache.delete(request)) deleted += 1
    }
  }

  if (type === 'all') {
    localStorage.removeItem('zhoudao:model-ever-loaded')
    localStorage.removeItem('zhoudao:last-backend')
  }
  return deleted
}

export async function getAiEnvironment() {
  const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null
  return {
    webgpu: Boolean(navigator.gpu),
    worker: typeof Worker !== 'undefined',
    cacheStorage: 'caches' in window,
    online: navigator.onLine,
    usage: estimate?.usage || 0,
    quota: estimate?.quota || 0,
    threads: navigator.hardwareConcurrency || null,
  }
}
