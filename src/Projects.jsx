import { useState } from 'react'

export function Projects({ projects, onEdit, onAdd }) {
  const [tab, setTab] = useState('active')
  const active = projects.filter(project => !isArchived(project))
  const archived = projects.filter(isArchived)
  const visible = tab === 'archived' ? archived : active

  return <div className="projects-page">
    <section className="project-overview-card">
      <div>
        <span className="project-eyebrow">PROJECTS</span>
        <strong>{active.length} 個進行中</strong>
        <p>把目前做到哪、下一步是什麼留在這裡。</p>
      </div>
      <button className="project-add-button" onClick={onAdd} aria-label="新增專案">＋</button>
    </section>

    <div className="project-tabs">
      <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
        進行中 <span>{active.length}</span>
      </button>
      <button className={tab === 'archived' ? 'active' : ''} onClick={() => setTab('archived')}>
        已完成 <span>{archived.length}</span>
      </button>
    </div>

    <section className="project-list-section">
      <div className="project-list-heading">
        <h2>{tab === 'archived' ? '已完成／封存' : '進行中專案'}</h2>
        <small>{visible.length} 個</small>
      </div>

      {visible.length ? <div className="stack project-card-stack">
        {visible.map(project => (
          <ProjectCard key={project.id} project={project} onEdit={onEdit} />
        ))}
      </div> : <div className="project-empty">
        <strong>{tab === 'archived' ? '目前沒有完成專案' : '目前沒有進行中專案'}</strong>
        <p>{tab === 'archived' ? '完成後的專案會保留在這裡。' : '新增一個專案開始記錄。'}</p>
      </div>}
    </section>
  </div>
}

function ProjectCard({ project, onEdit }) {
  const archived = isArchived(project)
  const progress = Number(project.progress || 0)

  return <button className="project-card" onClick={() => onEdit(project)}>
    <div className="project-card-top">
      <div>
        <span className="project-status-badge">{archived ? '已完成' : (project.status || '進行中')}</span>
        <strong>{project.name}</strong>
      </div>
      <span className="project-card-arrow">›</span>
    </div>

    <div className="project-progress-row">
      <span>進度</span>
      <strong>{progress}%</strong>
    </div>
    <div className="progress project-card-progress">
      <i style={{ width: progress + '%' }} />
    </div>

    <div className="project-card-copy">
      <div>
        <small>目前</small>
        <p>{project.current || '尚未填寫'}</p>
      </div>
      <div>
        <small>下一步</small>
        <p>{archived ? '已封存，可隨時查看' : (project.next || '尚未填寫')}</p>
      </div>
    </div>
  </button>
}

function isArchived(project) {
  return Boolean(project.archived)
    || String(project.status || '').includes('完成')
    || String(project.status || '').includes('封存')
}
