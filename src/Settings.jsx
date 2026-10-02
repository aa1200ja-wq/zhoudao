import { useRef } from 'react'
import { DEFAULT_SHORTCUTS, SHORTCUT_OPTIONS, resolveShortcut } from './navigation'

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
  const shortcuts = preferences.shortcuts?.length === 4
    ? preferences.shortcuts
    : DEFAULT_SHORTCUTS

  function setShortcut(index, id) {
    const next = [...shortcuts]
    next[index] = id
    onPreferenceChange({ shortcuts: next })
  }

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
        ><span /></button>
      </div>
    </section>

    <section className="settings-card">
      <div className="setting-title">
        <div><strong>首頁人物</strong><p>指定首頁小助手形象。</p></div>
      </div>
      <div className="assistant-setting">
        <div className="settings-avatar">
          {assistant.image ? <img src={assistant.image} alt="目前首頁人物" /> : <span>小周</span>}
        </div>
        <div className="setting-actions">
          <button className="secondary small" onClick={() => assistantInput.current?.click()}>更換圖片</button>
          <button className="ghost small" onClick={onAssistantReset}>恢復預設</button>
        </div>
        <input ref={assistantInput} hidden type="file" accept="image/*" onChange={e => onAssistantUpload(e.target.files?.[0])} />
      </div>
    </section>

    <section className="settings-card">
      <div className="setting-title">
        <div><strong>首頁背景</strong><p>切換預設背景，或上傳自己的圖片。</p></div>
      </div>
      <div className="background-options">
        {BACKGROUNDS.map(bg => <button
          key={bg.id}
          className={'background-swatch bg-' + bg.id + (preferences.homeBackground === bg.id ? ' selected' : '')}
          onClick={() => onPreferenceChange({ homeBackground: bg.id, backgroundImage: '' })}
        ><span>{bg.label}</span></button>)}
      </div>
      <button className="secondary full" onClick={() => backgroundInput.current?.click()}>上傳自訂背景</button>
      <input ref={backgroundInput} hidden type="file" accept="image/*" onChange={e => onBackgroundUpload(e.target.files?.[0])} />
    </section>

    <section className="settings-card">
      <div className="setting-title">
        <div><strong>左側快捷功能</strong><p>設定首頁左側 4 個圖標位置。</p></div>
      </div>
      <div className="shortcut-settings">
        {shortcuts.map((id, index) => {
          const current = resolveShortcut(id)
          return <label className="shortcut-select" key={index}>
            <span>位置 {index + 1}</span>
            <select value={current.id} onChange={e => setShortcut(index, e.target.value)}>
              {SHORTCUT_OPTIONS.map(option => <option key={option.id} value={option.id}>
                {option.icon} {option.label}
              </option>)}
            </select>
          </label>
        })}
      </div>
    </section>
  </div>
}