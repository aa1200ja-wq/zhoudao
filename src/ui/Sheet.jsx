import { X } from 'lucide-react'

export default function Sheet({ title, onClose, className = '', children }) {
  return <div className="overlay ui-sheet-overlay" onMouseDown={onClose}>
    <section
      className={'modal ui-sheet ' + className}
      onMouseDown={event => event.stopPropagation()}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <header className="ui-sheet-header">
        <h2>{title}</h2>
        <button className="ui-icon-button" onClick={onClose} aria-label="關閉">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="ui-sheet-body">{children}</div>
    </section>
  </div>
}
