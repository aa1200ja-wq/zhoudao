import { useState } from 'react'

export function Projects({ projects, onEdit, onAdd }) {
  return <>
    <button className="add-card" onClick={onAdd}>＋ 新增專案</button>
    <Section title="全部專案">{projects.map(p => <ProjectCard key={p.id} project={p} onEdit={onEdit} />)}</Section>
  </>
}

function ProjectCard({ project, onEdit }) {
  return <button className="card project-card" onClick={() => onEdit(project)}>
    <div className="row"><strong>{project.name}</strong><span>{project.status}</span></div>
    <div className="progress"><i style={{ width: project.progress + '%' }} /></div>
    <p>目前：{project.current || '尚未填寫'}</p>
    <p>下一步：{project.next || '尚未填寫'}</p>
  </button>
}

function Todo({ items, onAdd, onUpdate, onDelete, onConvert }) {
  const [text, setText] = useState('')
  const [tab, setTab] = useState('today')
  const [menuId, setMenuId] = useState(null)

  const normalized = items.map(item => ({
    ...item,
    bucket: item.bucket || 'today',
    completed: Boolean(item.completed),
    pinned: Boolean(item.pinned),
  }))

  const visible = normalized
    .filter(item => {
      if (tab === 'completed') return item.completed
      if (item.completed) return false
      return item.bucket === tab
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)

  const counts = {
    today: normalized.filter(item => !item.completed && item.bucket === 'today').length,
    later: normalized.filter(item => !item.completed && item.bucket === 'later').length,
    completed: normalized.filter(item => item.completed).length,
  }

  return <div className="todo-page">
    <div className="composer todo-composer">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="記點子、提醒自己，或寫下接下來要做的事…"
      />
      <button onClick={() => {
        onAdd(text)
        setText('')
        setTab('today')
      }}>存進待辦事項</button>
    </div>

    <div className="todo-tabs">
      <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
        今天 <span>{counts.today}</span>
      </button>
      <button className={tab === 'later' ? 'active' : ''} onClick={() => setTab('later')}>
        之後 <span>{counts.later}</span>
      </button>
      <button className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>
        完成 <span>{counts.completed}</span>
      </button>
    </div>

    {visible.length ? <div className="todo-list">
      {visible.map(item => <article className={'todo-item ' + (item.completed ? 'done' : '')} key={item.id}>
        <button
          className={'todo-check ' + (item.completed ? 'checked' : '')}
          onClick={() => onUpdate(item, { completed: !item.completed })}
          aria-label={item.completed ? '標記未完成' : '標記完成'}
        >{item.completed ? '✓' : ''}</button>

        <button className="todo-main" onClick={() => setMenuId(menuId === item.id ? null : item.id)}>
          <div className="todo-text-row">
            <p>{item.text}</p>
            {item.pinned && <span className="todo-pin">置頂</span>}
          </div>
          <small>{item.completed ? '已完成' : item.bucket === 'later' ? '之後' : '今天'} · {formatTime(item.updatedAt)}</small>
        </button>

        <button className="todo-more" onClick={() => setMenuId(menuId === item.id ? null : item.id)}>⋯</button>

        {menuId === item.id && <div className="todo-menu">
          {!item.completed && <button onClick={() => {
            onUpdate(item, { bucket: item.bucket === 'today' ? 'later' : 'today' })
            setMenuId(null)
          }}>{item.bucket === 'today' ? '移到之後' : '移到今天'}</button>}
          <button onClick={() => {
            onUpdate(item, { pinned: !item.pinned })
            setMenuId(null)
          }}>{item.pinned ? '取消置頂' : '置頂'}</button>
          {!item.completed && <button onClick={() => {
            onConvert(item)
            setMenuId(null)
          }}>轉成專案</button>}
          {item.completed && <button onClick={() => {
            onUpdate(item, { completed: false, bucket: 'today' })
            setMenuId(null)
          }}>恢復到今天</button>}
          <button className="danger" onClick={() => {
            onDelete(item.id)
            setMenuId(null)
          }}>刪除</button>
        </div>}
      </article>)}
    </div> : <div className="todo-empty">
      <strong>{tab === 'today' ? '今天沒有待辦' : tab === 'later' ? '之後沒有待辦' : '還沒有完成項目'}</strong>
      <p>{tab === 'today' ? '有想到什麼就直接記一句。' : '這裡會保持乾淨。'}</p>
    </div>}
  </div>
}

function Section({ title, children }) {
  return <section className="section"><h2>{title}</h2><div className="stack">{children}</div></section>
}

export function ProjectModal({ project, onClose, onSave }) {
  const [editing, setEditing] = useState(!project.id)
  const [draft, setDraft] = useState(project)

  if (!editing) {
    return <Sheet title="專案續接" onClose={onClose}>
      <div className="project-accordion-stack">
        <ProjectInfoAccordion
          label="項目名稱"
          value={project.name || '尚未填寫'}
        >
          <p><strong>狀態：</strong>{project.status || '尚未填寫'}</p>
          <p><strong>進度：</strong>{project.progress ?? 0}%</p>
          <p><strong>最後更新：</strong>{project.updatedAt ? formatTime(project.updatedAt) : '尚無紀錄'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="目前步驟"
          value={project.current || '尚未填寫'}
        >
          <p><strong>目前步驟：</strong>{project.currentStepDetail || project.current || '尚未填寫'}</p>
          <p><strong>本次要做：</strong>{project.currentTask || project.current || '尚未填寫'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="下一步"
          value={project.next || '尚未填寫'}
        >
          <p><strong>下一步：</strong>{project.nextDetail || project.next || '尚未填寫詳細內容'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="我的草稿"
          value={project.draft || '目前沒有草稿'}
        >
          <p>{project.draft || '目前沒有補充內容。'}</p>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="專案流程表"
          value="步驟、目前進度與下一步"
        >
          <section className="project-flow-section">
            <h3>【專案流程表】</h3>
            <pre>{project.flowText || buildFallbackFlow(project)}</pre>
          </section>
          <section className="project-detail-status">
            <p><strong>目前步驟：</strong>{project.currentStepDetail || project.current || '尚未填寫'}</p>
            <p><strong>本次要做：</strong>{project.currentTask || project.current || '尚未填寫'}</p>
            <p><strong>下一步：</strong>{project.nextDetail || project.next || '尚未填寫'}</p>
          </section>
        </ProjectInfoAccordion>

        <ProjectInfoAccordion
          label="專案詳細資料"
          value="README 式架構與版本紀錄"
        >
          <section className="project-readme-section">
            <h3>目前大架構</h3>
            <pre>{project.architectureText || '尚未建立專案架構摘要。'}</pre>
          </section>
          <section className="project-readme-section">
            <h3>版本變更紀錄</h3>
            <pre>{project.changelogText || '尚未建立版本變更紀錄。'}</pre>
          </section>
        </ProjectInfoAccordion>
      </div>

      <button className="secondary full" onClick={() => setEditing(true)}>編輯專案資料</button>
    </Sheet>
  }

  return <Sheet title={project.id ? '編輯專案' : '新增專案'} onClose={onClose}>
    <label>項目名稱<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
    <label>目前步驟<textarea value={draft.current} onChange={e => setDraft({ ...draft, current: e.target.value })} /></label>
    <label>下一步<textarea value={draft.next} onChange={e => setDraft({ ...draft, next: e.target.value })} /></label>
    <label>我的草稿<textarea value={draft.draft} onChange={e => setDraft({ ...draft, draft: e.target.value })} /></label>

    <details className="settings-card setting-accordion project-edit-detail">
      <summary>
        <div>
          <strong>專案流程表</strong>
          <p>步驟、目前進度、本次要做與下一步。</p>
        </div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body project-edit-detail-body">
        <label>流程表
          <textarea
            className="flow-editor"
            value={draft.flowText || ''}
            onChange={e => setDraft({ ...draft, flowText: e.target.value })}
            placeholder={'☑ 步驟1：…\n☑ 步驟2：…\n□ 步驟3：…'}
          />
        </label>
        <label>目前步驟（詳細）
          <textarea value={draft.currentStepDetail || ''} onChange={e => setDraft({ ...draft, currentStepDetail: e.target.value })} />
        </label>
        <label>本次要做
          <textarea value={draft.currentTask || ''} onChange={e => setDraft({ ...draft, currentTask: e.target.value })} />
        </label>
        <label>下一步（詳細）
          <textarea value={draft.nextDetail || ''} onChange={e => setDraft({ ...draft, nextDetail: e.target.value })} />
        </label>
      </div>
    </details>

    <details className="settings-card setting-accordion project-edit-detail">
      <summary>
        <div>
          <strong>專案詳細資料</strong>
          <p>README 式架構摘要與版本累積紀錄。</p>
        </div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body project-edit-detail-body">
        <label>目前大架構
          <textarea
            className="readme-editor"
            value={draft.architectureText || ''}
            onChange={e => setDraft({ ...draft, architectureText: e.target.value })}
            placeholder={'### 目前大架構\n- 核心資料流…\n- 主要功能…\n- 儲存方式…'}
          />
        </label>
        <label>版本變更紀錄
          <textarea
            className="readme-editor"
            value={draft.changelogText || ''}
            onChange={e => setDraft({ ...draft, changelogText: e.target.value })}
            placeholder={'### V1\n- 建立中央資料庫\n\n### V2\n- 改成 GitHub 為長期記憶…'}
          />
        </label>
      </div>
    </details>

    <label>進度<input type="range" min="0" max="100" value={draft.progress} onChange={e => setDraft({ ...draft, progress: Number(e.target.value) })} /><span>{draft.progress}%</span></label>
    <button className="primary full" disabled={!draft.name.trim()} onClick={() => onSave(draft)}>
      {project.id ? '儲存修改' : '建立專案'}
    </button>
  </Sheet>
}

function ProjectInfoAccordion({ label, value, children }) {
  return <details className="settings-card setting-accordion project-info-accordion">
    <summary>
      <div>
        <strong>{label}</strong>
        <p>{value}</p>
      </div>
      <span className="accordion-chevron">⌄</span>
    </summary>
    <div className="accordion-body project-info-body">
      {children}
    </div>
  </details>
}

function buildFallbackFlow(project) {
  return [
    '□ ' + (project.current || '目前步驟尚未填寫'),
    '□ ' + (project.next || '下一步尚未填寫'),
  ].join('\n')
}


function formatTime(value) {
  return new Date(value).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Sheet({ title, onClose, children }) {
  return <div className="overlay" onMouseDown={onClose}>
    <div className="modal" onMouseDown={e => e.stopPropagation()}>
      <div className="row">
        <h2>{title}</h2>
        <button className="icon" onClick={onClose}>×</button>
      </div>
      {children}
    </div>
  </div>
}
