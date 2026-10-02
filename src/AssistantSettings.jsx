import { useEffect, useRef, useState } from 'react'

export default function AssistantSettings({
  assistant,
  projects,
  onAssistantUpload,
  onAssistantChange,
}) {
  const imageInput = useRef(null)
  const [name, setName] = useState(assistant.name || '小周')
  const [lines, setLines] = useState((assistant.customLines || []).join('\n'))

  useEffect(() => {
    setName(assistant.name || '小周')
    setLines((assistant.customLines || []).join('\n'))
  }, [assistant])

  const activeValue = assistant.activeProjectId || '__auto__'

  function saveTextSettings() {
    onAssistantChange({
      name: name.trim() || '小周',
      customLines: lines
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean),
    })
  }

  return <details className="settings-card setting-accordion">
    <summary>
      <div>
        <strong>首頁小助理</strong>
        <p>人物、名字、當前專案與台詞本。</p>
      </div>
      <span className="accordion-chevron">⌄</span>
    </summary>

    <div className="accordion-body assistant-config">
      <div className="assistant-setting">
        <div className="settings-avatar">
          {assistant.image
            ? <img src={assistant.image} alt="目前首頁人物" />
            : <span>{assistant.name || '小周'}</span>}
        </div>
        <div className="setting-actions">
          <button className="secondary small" onClick={() => imageInput.current?.click()}>
            更換圖片
          </button>
          <button
            className="ghost small"
            onClick={() => onAssistantChange({ image: '', name: '小周' })}
          >
            恢復預設人物
          </button>
        </div>
        <input
          ref={imageInput}
          hidden
          type="file"
          accept="image/*"
          onChange={e => onAssistantUpload(e.target.files?.[0])}
        />
      </div>

      <label className="assistant-field">
        <span>人物名字</span>
        <input value={name} onChange={e => setName(e.target.value)} />
      </label>

      <label className="assistant-field">
        <span>當前專案</span>
        <select
          value={activeValue}
          onChange={e => onAssistantChange({
            activeProjectId: e.target.value === '__auto__' ? '' : e.target.value,
          })}
        >
          <option value="__auto__">自動：最近進行中的專案</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </label>

      <div className="setting-row assistant-toggle">
        <div>
          <strong>動態專案台詞</strong>
          <p>自動讀取當前專案的目前步驟、本次要做與下一步。</p>
        </div>
        <button
          className={'switch ' + (assistant.dynamicDialogue ? 'on' : '')}
          onClick={() => onAssistantChange({
            dynamicDialogue: !assistant.dynamicDialogue,
          })}
          aria-label="切換動態專案台詞"
        >
          <span />
        </button>
      </div>

      <label className="assistant-field">
        <span>台詞本</span>
        <textarea
          value={lines}
          onChange={e => setLines(e.target.value)}
          placeholder={'一行一句，例如：\n有想法先記下來。\n先做完一件再開新的。'}
        />
        <small>點首頁人物時，會和動態專案台詞一起輪播。</small>
      </label>

      <button className="primary full" onClick={saveTextSettings}>
        儲存名字與台詞
      </button>
    </div>
  </details>
}
