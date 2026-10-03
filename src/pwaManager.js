import { registerSW } from 'virtual:pwa-register'

let installPrompt = null
let registration = null
let needsRefresh = false
let installed = isStandalone()
const listeners = new Set()

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    needsRefresh = true
    emit()
  },
  onRegisteredSW(_url, currentRegistration) {
    registration = currentRegistration
    emit()
  },
})

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  installPrompt = event
  emit()
})

window.addEventListener('appinstalled', () => {
  installPrompt = null
  installed = true
  emit()
})

export function getPwaState() {
  return {
    installed,
    canInstall: Boolean(installPrompt),
    needsRefresh,
  }
}

export function subscribePwa(listener) {
  listeners.add(listener)
  listener(getPwaState())
  return () => listeners.delete(listener)
}

export async function requestPwaInstall() {
  if (installed) return { outcome: 'installed' }

  if (installPrompt) {
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    installPrompt = null
    emit()
    return choice
  }

  if (isIos()) return { outcome: 'ios-manual' }
  return { outcome: 'manual' }
}

export async function checkPwaUpdate() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false }
  }

  if (!registration) {
    registration = await navigator.serviceWorker.ready
  }

  await registration.update()
  return { supported: true, needsRefresh }
}

export async function applyPwaUpdate() {
  needsRefresh = false
  emit()
  await updateSW(true)
}

function emit() {
  const state = getPwaState()
  listeners.forEach(listener => listener(state))
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}
