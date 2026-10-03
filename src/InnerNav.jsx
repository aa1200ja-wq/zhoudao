import { resolveBottomNav } from './navigation'

export default function InnerNav({ page, items, onOpen }) {
  return <nav className="inner-nav">
    {items.map(item => {
      const nav = resolveBottomNav(item)
      return <button
        key={nav.page}
        className={page === nav.page ? 'active' : ''}
        onClick={() => onOpen(nav.page)}
      >
        <span className="inner-nav-icon" aria-hidden="true">{nav.icon}</span>
        <span className="inner-nav-label">{nav.label}</span>
      </button>
    })}
  </nav>
}
