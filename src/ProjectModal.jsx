import { useState } from 'react'

export function ProjectModal({ project, onClose, onSave, onArchive }) {
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

      <div className="project-modal-actions">
        <button className="secondary full" onClick={() => setEditing(true)}>編輯專案資料</button>
        <button
          className={isArchived(project) ? 'secondary full' : 'primary full'}
          onClick={() => onArchive(project, !isArchived(project))}
        >
          {isArchived(project) ? '恢復進行中' : '標記完成並封存'}
        </button>
      </div>
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


function isArchived(project) {
  return Boolean(project.archived)
    || String(project.status || '').includes('完成')
    || String(project.status || '').includes('封存')
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
