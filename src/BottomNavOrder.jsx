import { useState } from 'react'
import { normalizeBottomNav, resolveBottomNav } from './navigation'

export default function BottomNavOrder({ items, onChange }) {
  const [dragIndex, setDragIndex] = useState(null)
  const ordered = normalizeBottomNav(items)

  function move(from, to) {
    if (from === to || from == null || to == null) return
    const next = [...ordered]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
    setDragIndex(to)
  }

  function pointerMove(event) {
    if (dragIndex == null) return
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-nav-index]')
    if (!target) return
    move(dragIndex, Number(target.dataset.navIndex))
  }

  return <div className="nav-order-list">
    {ordered.map((page, index) => {
      const nav = resolveBottomNav(page)
      return <button
        key={page}
        type="button"
        className={'nav-order-item ' + (dragIndex === index ? 'dragging' : '')}
        data-nav-index={index}
        onPointerDown={event => {
          setDragIndex(index)
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={pointerMove}
        onPointerUp={() => setDragIndex(null)}
        onPointerCancel={() => setDragIndex(null)}
      >
        <span className="drag-handle">≡</span>
        <strong>{nav.label}</strong>
        <small>位置 {index + 1}</small>
      </button>
    })}
    <p className="nav-order-hint">按住後上下拖曳調整順序。</p>
  </div>
}
