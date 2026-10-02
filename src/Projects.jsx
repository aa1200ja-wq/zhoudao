import { useState } from 'react'

export function Projects({ projects, onEdit, onAdd }) {
  const [tab, setTab] = useState('active')
  const active = projects.filter(project => !isArchived(project))
  const archived = projects.filter(isArchived)
  const visible = tab === 'archived' ? archived : active

  return <>
    <button className="add-card" onClick={onAdd}>＋ 新增專案</button>

    <div className="project-tabs">
      <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
        進行中 <span>{active.length}</span>
      </button>
      <button className={tab === 'archived' ? 'active' : ''} onClick={() => setTab('archived')}>
        已完成 <span>{archived.length}</span>
      </button>
    </div>

    <section className="section project-list-section">
      <h2>{tab === 'archived' ? '已完成／封存' : '進行中專案'}</h2>
      {visible.length ? <div className="stack">
        {visible.map(project => (
          <ProjectCard key={project.id} project={project} onEdit={onEdit} />
        ))}
      </div> : <div className="project-empty">
        <strong>{tab === 'archived' ? '目前沒有完成專案' : '目前沒有進行中專案'}</strong>
        <p>{tab === 'archived' ? '完成後的專案會保留在這裡。' : '新增一個專案開始記錄。'}</p>
      </div>}
    </section>
  </>
}

function ProjectCard({ project, onEdit }) {
  return <button className="card project-card" onClick={() => onEdit(project)}>
    <div className="row">
      <strong>{project.name}</strong>
      <span>{isArchived(project) ? '已完成' : project.status}</span>
    </div>
    <div className="progress">
      <i style={{ width: project.progress + '%' }} />
    </div>
    <p>目前：{project.current || '尚未填寫'}</p>
    <p>下一步：{isArchived(project) ? '已封存，可隨時查看' : (project.next || '尚未填寫')}</p>
  </button>
}

function isArchived(project) {
  return Boolean(project.archived)
    || String(project.status || '').includes('完成')
    || String(project.status || '').includes('封存')
}
