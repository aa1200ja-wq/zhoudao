import { useEffect, useState } from 'react'
import { normalizeBottomNav, resolveBottomNav } from './navigation'

export default function BottomNavOrder({ items, onChange }) {
  const [order, setOrder] = useState(() => normalizeBottomNav(items))
  const [dragIndex, setDragIndex] = useState(null)

  useEffect(() => {
    if (dragIndex == null) setOrder(normalizeBottomNav(items))
  }, [items, dragIndex])

  function move(from, to) {
    if (from === to || from == null || to == null) return
    setOrder(current => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
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

  function finishDrag() {
    if (dragIndex != null) onChange(order)
    setDragIndex(null)
  }

  return <div className="nav-order-list">
    {order.map((page, index) => {
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
        onPointerUp={finishDrag}
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
