export const DEFAULT_ASSISTANT = {
  key: 'assistant',
  name: '小周',
  image: '',
  activeProjectId: '',
  dynamicDialogue: true,
  customLines: [
    '有想法先記下來，不要放在腦袋裡。',
  ],
}

export function normalizeAssistant(saved) {
  return {
    ...DEFAULT_ASSISTANT,
    ...(saved || {}),
    customLines: Array.isArray(saved?.customLines)
      ? saved.customLines
      : DEFAULT_ASSISTANT.customLines,
  }
}
