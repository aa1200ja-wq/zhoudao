import { useRef } from 'react'
import AssistantSettings from './AssistantSettings'
import BottomNavOrder from './BottomNavOrder'
import PwaInstall from './PwaInstall'
import { DEFAULT_BOTTOM_NAV, DEFAULT_SHORTCUTS, SHORTCUT_OPTIONS, resolveShortcut } from './navigation'

const BACKGROUNDS = [
  { id: 'cream', label: '奶油白' },
  { id: 'paper', label: '紙感' },
  { id: 'night', label: '夜色' },
  { id: 'clean', label: '極簡' },
]

export default function Settings({
  assistant,
  projects,
  preferences,
  onAssistantUpload,
  onAssistantChange,
  onPreferenceChange,
  onBackgroundUpload,
}) {
  const backgroundInput = useRef(null)
  const shortcuts = preferences.shortcuts?.length === 4
    ? preferences.shortcuts
    : DEFAULT_SHORTCUTS
  const bottomNav = preferences.bottomNav?.length === 5
    ? preferences.bottomNav
    : DEFAULT_BOTTOM_NAV

  function setShortcut(index, id) {
    const next = [...shortcuts]
    next[index] = id
    onPreferenceChange({ shortcuts: next })
  }


  return <div className="settings-page">
    <div className="settings-intro">
      <span>SETTINGS</span>
      <strong>把周到調成你順手的樣子</strong>
      <p>介面、首頁、導覽與 PWA 都集中在這裡。</p>
    </div>

    <p className="settings-section-label">一般</p>
    <details className="settings-card setting-accordion" open>
      <summary>
        <div><strong>顯示與預覽</strong><p>深色模式、手機預覽。</p></div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body">
        <div className="setting-row">
          <div><strong>深色模式</strong><p>切換整個介面的明暗主題。</p></div>
          <button
            className={'switch ' + (preferences.darkMode ? 'on' : '')}
            onClick={() => onPreferenceChange({ darkMode: !preferences.darkMode })}
            aria-label="切換深色模式"
          ><span /></button>
        </div>
        <div className="setting-row setting-divider">
          <div><strong>手機預覽模式</strong><p>桌機上縮成手機寬度檢查 UI。</p></div>
          <button
            className={'switch ' + (preferences.mobilePreview ? 'on' : '')}
            onClick={() => onPreferenceChange({ mobilePreview: !preferences.mobilePreview })}
            aria-label="切換手機預覽模式"
          ><span /></button>
        </div>
      </div>
    </details>

    <AssistantSettings
      assistant={assistant}
      projects={projects}
      onAssistantUpload={onAssistantUpload}
      onAssistantChange={onAssistantChange}
    />

    <PwaInstall />

    <p className="settings-section-label">外觀與導覽</p>
    <details className="settings-card setting-accordion">
      <summary>
        <div><strong>首頁背景</strong><p>預設背景與自訂圖片。</p></div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body">
        <div className="background-options">
          {BACKGROUNDS.map(bg => <button
            key={bg.id}
            className={'background-swatch bg-' + bg.id + (preferences.homeBackground === bg.id ? ' selected' : '')}
            onClick={() => onPreferenceChange({ homeBackground: bg.id, backgroundImage: '' })}
          ><span>{bg.label}</span></button>)}
        </div>
        <button className="secondary full" onClick={() => backgroundInput.current?.click()}>上傳自訂背景</button>
        <input ref={backgroundInput} hidden type="file" accept="image/*" onChange={e => onBackgroundUpload(e.target.files?.[0])} />
      </div>
    </details>


    <details className="settings-card setting-accordion">
      <summary>
        <div><strong>底部導覽列</strong><p>拖曳 5 個入口調整順序。</p></div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body">
        <BottomNavOrder
          items={bottomNav}
          onChange={next => onPreferenceChange({ bottomNav: next })}
        />
      </div>
    </details>

    <details className="settings-card setting-accordion">
      <summary>
        <div><strong>左側快捷功能</strong><p>設定首頁左側 4 個快捷位置。</p></div>
        <span className="accordion-chevron">⌄</span>
      </summary>
      <div className="accordion-body">
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
      </div>
    </details>
  </div>
}