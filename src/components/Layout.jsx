import React from 'react'

const s = {
  shell: { display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 430, margin: '0 auto', background: '#000', position: 'relative' },
  scroll: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
}

export default function Layout({ children, footer }) {
  return (
    <div style={s.shell}>
      <div style={s.scroll}>{children}</div>
      {footer}
    </div>
  )
}
