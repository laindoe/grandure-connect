import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function BackHeader({ label, title }) {
  const nav = useNavigate()
  return (
    <div style={s.wrap}>
      <button style={s.back} onClick={() => nav(-1)}>←</button>
      <div style={{ textAlign: 'center' }}>
        <p style={s.label}>{label}</p>
        <p style={s.title}>{title}</p>
      </div>
      <div style={{ width: 36 }} />
    </div>
  )
}

const s = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px', borderBottom: '1px solid #1a1a1a' },
  back: { width: 36, height: 36, borderRadius: 18, background: '#1a1a1a', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' },
  label: { color: '#666', fontSize: 10, letterSpacing: 2 },
  title: { color: '#fff', fontSize: 16, fontWeight: 700 },
}
