import React from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import BackHeader from '../components/BackHeader'
import IdeaCaptureBar from '../components/IdeaCaptureBar'
import { BRANDS } from '../data/mockData'

const TYPE = {
  note: { icon: '📝', color: '#FF9800', label: 'Note' },
  link: { icon: '🔗', color: '#7B68EE', label: 'Link' },
  image: { icon: '🖼', color: '#4A90D9', label: 'Image' },
}

export default function Inspiration() {
  const { id } = useParams()
  const brand = BRANDS.find(b => b.id === id)

  return (
    <Layout footer={<IdeaCaptureBar />}>
      <BackHeader label="INSPIRATION GALLERY" title={brand.name} />
      <div style={{ padding: 16 }}>
        <div style={s.grid}>
          {brand.inspiration.map(item => {
            const config = TYPE[item.type] || TYPE.note
            return (
              <div key={item.id} style={s.card}>
                <div style={{ ...s.typeIcon, background: config.color + '22' }}>{config.icon}</div>
                <p style={s.typeLabel}>{config.label}</p>
                <p style={s.content}>{item.content}</p>
              </div>
            )
          })}
          <div style={s.addCard}>
            <div style={s.addIcon}>+</div>
            <p style={{ color: '#555', fontSize: 13 }}>Add</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  card: { background: '#111', borderRadius: 14, padding: 14, border: '1px solid #1e1e1e' },
  typeIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 },
  typeLabel: { color: '#555', fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  content: { color: '#ccc', fontSize: 12, lineHeight: 1.6 },
  addCard: { background: '#0a0a0a', borderRadius: 14, padding: 14, border: '1px dashed #1e1e1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 120, cursor: 'pointer' },
  addIcon: { width: 40, height: 40, borderRadius: 20, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 22 },
}
