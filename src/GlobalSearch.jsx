import { useMemo, useState } from 'react'

export default function GlobalSearch({ projects, inbox, library, onOpenPage, onOpenProject }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return []

    const projectResults = projects
      .filter(project => matches(keyword, [
        project.name,
        project.status,
        project.current,
        project.next,
        project.draft,
        project.flowText,
        project.currentStepDetail,
        project.currentTask,
        project.nextDetail,
        project.architectureText,
        project.changelogText,
      ]))
      .map(project => ({
        id: 'project-' + project.id,
        type: '專案',
        title: project.name,
        summary: project.current || project.next || '專案資料',
        action: () => onOpenProject(project),
      }))

    const inboxResults = inbox
      .filter(item => matches(keyword, [item.text]))
      .map(item => ({
        id: 'todo-' + item.id,
        type: '待辦',
        title: item.text,
        summary: '待辦事項',
        action: () => onOpenPage('待辦事項'),
      }))

    const promptResults = library
      .filter(item => matches(keyword, [
        item.title,
        item.content,
        item.note,
        item.folder,
        ...(item.tags || []),
      ]))
      .map(item => ({
        id: 'prompt-' + item.id,
        type: '提示詞',
        title: item.title,
        summary: item.folder || '未整理',
        action: () => onOpenPage('提示詞'),
      }))

    return [...projectResults, ...inboxResults, ...promptResults]
  }, [query, projects, inbox, library, onOpenPage, onOpenProject])

  return <div className="global-search-page">
    <div className="global-search-box">
      <span>⌕</span>
      <input
        autoFocus
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜尋專案、待辦、提示詞、README…"
      />
      {query && <button onClick={() => setQuery('')}>×</button>}
    </div>

    {!query.trim() ? <div className="search-empty-state">
      <strong>輸入關鍵字</strong>
      <p>會一起搜尋專案、待辦、提示詞與專案詳細資料。</p>
    </div> : <>
      <div className="search-result-count">{results.length} 筆結果</div>
      {results.length ? <div className="search-result-list">
        {results.map(item => <button key={item.id} className="search-result-card" onClick={item.action}>
          <span>{item.type}</span>
          <strong>{item.title}</strong>
          <small>{item.summary}</small>
        </button>)}
      </div> : <div className="search-empty-state">
        <strong>找不到相關內容</strong>
        <p>可以換一個關鍵字再試。</p>
      </div>}
    </>}
  </div>
}

function matches(keyword, fields) {
  return fields.filter(Boolean).join(' ').toLowerCase().includes(keyword)
}
