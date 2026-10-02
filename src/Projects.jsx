export function Projects({ projects, onEdit, onAdd }) {
  return <>
    <button className="add-card" onClick={onAdd}>＋ 新增專案</button>
    <section className="section">
      <h2>全部專案</h2>
      <div className="stack">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} onEdit={onEdit} />
        ))}
      </div>
    </section>
  </>
}

function ProjectCard({ project, onEdit }) {
  return <button className="card project-card" onClick={() => onEdit(project)}>
    <div className="row">
      <strong>{project.name}</strong>
      <span>{project.status}</span>
    </div>
    <div className="progress">
      <i style={{ width: project.progress + '%' }} />
    </div>
    <p>目前：{project.current || '尚未填寫'}</p>
    <p>下一步：{project.next || '尚未填寫'}</p>
  </button>
}
