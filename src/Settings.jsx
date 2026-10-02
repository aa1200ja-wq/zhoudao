import { useRef } from 'react'

const BACKGROUNDS = [
  { id: 'cream', label: '奶油白' },
  { id: 'paper', label: '紙感' },
  { id: 'night', label: '夜色' },
  { id: 'clean', label: '極簡' },
]

export default function Settings({
  assistant,
  preferences,
  onAssistantUpload,
  onAssistantReset,
  onPreferenceChange,
  onBackgroundUpload,
}) {
  const assistantInput = useRef(null)
  const backgroundInput = useRef(null)

  return <div className="settings-page">
    <section className="settings-card">
      <div className="setting-row">
        <div>
          <strong>深色模式</strong>
          <p>切換整個小助手介面的明暗主題。</p>
        </div>
        <button
          className={'switch ' + (preferences.darkMode ? 'on' : '')}
          onClick={() => onPreferenceChange({ darkMode: !preferences.darkMode })}
          aria-label="切換深色模式"
        >
          <span />
        </button>
      </div>
    </section>

    <section className="settings-card">
      <div className="setting-title">
        <div>
          <strong>首頁人物</strong>
          <p>指定首頁小助手形象。</p>
        </div>
      </div>
      <div className="assistant-setting">
        <div className="settings-avatar">
          {assistant.image ? <img src={assistant.image} alt="目前首頁人物" /> : <span>小周</span>}
        </div>
        <div className="setting-actions">
          <button className="secondary small" onClick={() => assistantInput.current?.click()}>更換圖片</button>
          <button className="ghost small" onClick={onAssistantReset}>恢復預設</button>
        </div>
        <input
          ref={assistantInput}
          hidden
          type="file"
          accept="image/*"
          onChange={e => onAssistantUpload(e.target.files?.[0])}
        />
      </div>
    </section>

    <section className="settings-card">
      <div className="setting-title">
        <div>
          <strong>首頁背景</strong>
          <p>可切換預設背景，或上傳自己的圖片。</p>
        </div>
      </div>
      <div className="background-options">
        {BACKGROUNDS.map(bg => (
          <button
            key={bg.id}
            className={'background-swatch bg-' + bg.id + (preferences.homeBackground === bg.id ? ' selected' : '')}
            onClick={() => onPreferenceChange({ homeBackground: bg.id, backgroundImage: '' })}
          >
            <span>{bg.label}</span>
          </button>
        ))}
      </div>
      <button className="secondary full" onClick={() => backgroundInput.current?.click()}>上傳自訂背景</button>
      <input
        ref={backgroundInput}
        hidden
        type="file"
        accept="image/*"
        onChange={e => onBackgroundUpload(e.target.files?.[0])}
      />
    </section>
  </div>
}