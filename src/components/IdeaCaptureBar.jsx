import React, { useState } from 'react'
import { BRANDS } from '../data/mockData'

export default function IdeaCaptureBar() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [brand, setBrand] = useState(null)
  const [platform, setPlatform] = useState(null)
  const [format, setFormat] = useState(null)

  const platforms = ['instagram', 'threads', 'youtube', 'newsletter', 'blog']
  const formats = ['Reel', 'Carousel', 'Thread', 'Long-form', 'Short', 'Story', 'Email']

  function save() { setText(''); setBrand(null); setPlatform(null); setFormat(null); setOpen(false) }

  return (
    <>
      <div style={bar}>
        <button style={iconBtn} onClick={() => {}}>🎙</button>
        <button style={inputWrap} onClick={() => setOpen(true)}>{text || <span style={{ color: '#555' }}>Capture an idea...</span>}</button>
        <button style={iconBtn} onClick={() => {}}>🖼</button>
      </div>

      {open && (
        <div style={overlay} onClick={() => setOpen(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={handle} />
            <p style={title}>New Idea</p>
            <textarea style={input} placeholder="What's the idea?" value={text} onChange={e => setText(e.target.value)} autoFocus />

            <p style={label}>BRAND</p>
            <div style={chipRow}>
              {BRANDS.map(b => <Chip key={b.id} active={brand === b.id} onClick={() => setBrand(b.id)}>{b.name}</Chip>)}
            </div>

            <p style={label}>PLATFORM</p>
            <div style={chipRow}>
              {platforms.map(p => <Chip key={p} active={platform === p} onClick={() => setPlatform(p)}>{p}</Chip>)}
            </div>

            <p style={label}>FORMAT</p>
            <div style={chipRow}>
              {formats.map(f => <Chip key={f} active={format === f} onClick={() => setFormat(f)}>{f}</Chip>)}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button style={cancelBtn} onClick={() => setOpen(false)}>Cancel</button>
              <button style={saveBtn} onClick={save}>Save to Vault</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...chipStyle, ...(active ? chipActive : {}) }}>
      {children}
    </button>
  )
}

const bar = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 20px', background: '#111', borderTop: '1px solid #222' }
const iconBtn = { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 8 }
const inputWrap = { flex: 1, background: '#1e1e1e', border: 'none', borderRadius: 20, padding: '10px 14px', color: '#fff', fontSize: 14, cursor: 'text', textAlign: 'left' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }
const sheet = { background: '#111', borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 430, margin: '0 auto' }
const handle = { width: 36, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }
const title = { color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 16 }
const input = { width: '100%', background: '#1e1e1e', border: 'none', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, minHeight: 80, resize: 'none', marginBottom: 20, fontFamily: 'inherit' }
const label = { color: '#666', fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }
const chipRow = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }
const chipStyle = { border: '1px solid #333', borderRadius: 20, padding: '6px 14px', background: 'none', color: '#888', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }
const chipActive = { background: '#fff', borderColor: '#fff', color: '#000', fontWeight: 600 }
const cancelBtn = { flex: 1, padding: 14, borderRadius: 12, border: '1px solid #333', background: 'none', color: '#888', fontSize: 15, cursor: 'pointer' }
const saveBtn = { flex: 2, padding: 14, borderRadius: 12, border: 'none', background: '#fff', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
