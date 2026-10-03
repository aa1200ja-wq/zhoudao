import { db } from '../db'

const LIMITS = {
  draft: 900,
  flowText: 1200,
  currentStepDetail: 500,
  currentTask: 500,
  nextDetail: 500,
  architectureText: 900,
  changelogText: 700,
}

export async function buildLocalAiContext(extra = {}) {
  const [projects, inbox, assistant, activity] = await Promise.all([
    db.projects.orderBy('updatedAt').reverse().toArray(),
    db.inbox.orderBy('updatedAt').reverse().toArray(),
    db.settings.get('assistant'),
    db.activity.orderBy('createdAt').reverse().limit(8).toArray(),
  ])

  const activeProjects = projects.filter(project => !isArchived(project))
  const activeProject = pickActiveProject(activeProjects, assistant?.activeProjectId)
  const openTodos = inbox.filter(isOpenToday).slice(0, 10)

  return {
    timeOfDay: extra.timeOfDay || timeOfDay(),
    assistantName: extra.assistantName || assistant?.name || '小周',
    pending: Number(extra.pending || 0),
    activeProject: activeProject ? compactProject(activeProject) : null,
    activeProjects: activeProjects.slice(0, 5).map(project => ({
      id: project.id,
      name: project.name || '未命名專案',
      status: project.status || '進行中',
      progress: project.progress ?? 0,
      current: clean(project.current, 180),
      next: clean(project.next, 180),
      updatedAt: project.updatedAt || 0,
    })),
    openTodos: openTodos.map(item => ({
      id: item.id,
      text: clean(item.text, 180),
      pinned: Boolean(item.pinned),
    })),
    recentActivity: activity.map(item => ({
      projectName: item.projectName || '未命名專案',
      summary: clean(item.summary, 180),
      createdAt: item.createdAt || 0,
    })),
    counts: {
      projects: activeProjects.length,
      todos: openTodos.length,
    },
  }
}

export function formatLocalAiContext(context) {
  const project = context.activeProject
  const lines = [
    '【時間】' + context.timeOfDay,
    '【進行中專案數】' + context.counts.projects,
    '【今日未完成待辦數】' + context.counts.todos,
  ]

  if (project) {
    lines.push(
      '',
      '【目前專案】' + project.name,
      '狀態：' + project.status,
      '進度：' + project.progress + '%',
      field('目前步驟', project.current),
      field('目前步驟詳細', project.currentStepDetail),
      field('本次要做', project.currentTask),
      field('下一步', project.next),
      field('下一步詳細', project.nextDetail),
      field('我的草稿', project.draft),
      field('專案流程表', project.flowText),
      field('專案架構', project.architectureText),
      field('版本紀錄', project.changelogText),
    )
  } else {
    lines.push('', '【目前專案】無')
  }

  if (context.openTodos.length) {
    lines.push(
      '',
      '【今天未完成待辦】',
      ...context.openTodos.map((item, index) =>
        (index + 1) + '. ' + item.text + (item.pinned ? '（置頂）' : '')),
    )
  } else {
    lines.push('', '【今天未完成待辦】無')
  }

  if (context.activeProjects.length > 1) {
    lines.push(
      '',
      '【其他進行中專案】',
      ...context.activeProjects
        .filter(item => item.id !== project?.id)
        .map(item => '- ' + item.name + '｜目前：' + (item.current || '未填') + '｜下一步：' + (item.next || '未填')),
    )
  }

  if (context.recentActivity.length) {
    lines.push(
      '',
      '【最近專案變更】',
      ...context.recentActivity.map(item => '- ' + item.projectName + '｜' + item.summary),
    )
  }

  if (context.pending > 0) lines.push('', '【待同步】' + context.pending + ' 項')
  return lines.filter(line => line !== null && line !== undefined).join('\n')
}

export function contextOverview(context) {
  return {
    activeProject: context.activeProject?.name || '無',
    current: context.activeProject?.current || '未填',
    draft: Boolean(context.activeProject?.draft),
    flow: Boolean(context.activeProject?.flowText),
    projectCount: context.counts.projects,
    todoCount: context.counts.todos,
    activityCount: context.recentActivity.length,
  }
}

function compactProject(project) {
  const result = {
    id: project.id,
    name: project.name || '未命名專案',
    status: project.status || '進行中',
    progress: project.progress ?? 0,
  }
  for (const [key, limit] of Object.entries(LIMITS)) {
    result[key] = clean(project[key], limit)
  }
  result.current = clean(project.current, 260)
  result.next = clean(project.next, 260)
  return result
}

function pickActiveProject(projects, preferredId) {
  if (preferredId) {
    const selected = projects.find(project => project.id === preferredId)
    if (selected) return selected
  }
  return projects[0] || null
}

function isArchived(project) {
  const status = String(project?.status || '')
  return Boolean(project?.archived)
    || status.includes('完成')
    || status.includes('封存')
    || status.includes('結案')
}

function isOpenToday(item) {
  const today = dayKey()
  if (item.completedDate === today || item.skippedDate === today) return false
  if (item.completed && dayKey(item.updatedAt) === today) return false
  return true
}

function field(label, value) {
  return label + '：' + (value || '未填')
}

function clean(value, max) {
  const text = String(value || '').trim()
  return text.length > max ? text.slice(0, max) + '…' : text
}

function dayKey(value = Date.now()) {
  const date = new Date(value)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function timeOfDay() {
  const hour = new Date().getHours()
  if (hour < 6) return '深夜'
  if (hour < 12) return '上午'
  if (hour < 18) return '下午'
  return '晚上'
}
