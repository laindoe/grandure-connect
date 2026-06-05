import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import BackHeader from '../components/BackHeader'
import IdeaCaptureBar from '../components/IdeaCaptureBar'
import { BRANDS } from '../data/mockData'

const ICONS = { instagram: '◻', threads: '@', youtube: '▶' }

export default function IdeaVault() {
  const { id } = useParams()
  const brand = BRANDS.find(b => b.id === id)
  const [platform, setPlatform] = useState('All')
  const [format, setFormat] = useState('All')

  const platforms = ['All', ...brand.stats.map(s => s.platform)]
  const formats = ['All', 'Reel', 'Carousel', 'Thread', 'Long-form']

  const filtered = brand.ideas.filter(idea => {
    return (platform === 'All' || idea.platform === platform) && (format === 'All' || idea.format === format)
  })

  return (
    <Layout footer={<IdeaCaptureBar />}>
      <BackHeader label="IDEA VAULT" title={brand.name} />
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a' }}>
        <p style={s.filterLabel}>Platform</p>
        <div style={s.chipRow}>
          {platforms.map(p => <Chip key={p} active={platform === p} onClick={() => setPlatform(p)}>{p}</Chip>)}
        </div>
        <p style={{ ...s.filterLabel, marginTop: 10 }}>Format</p>
        <div style={s.chipRow}>
          {formats.map(f => <Chip key={f} active={format === f} onClick={() => setFormat(f)}>{f}</Chip>)}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <p style={{ color: '#555', fontSize: 12, marginBottom: 12 }}>{filtered.length} ideas</p>
        {filtered.map(idea => (
          <div key={idea.id} style={s.card}>
            <div style={s.cardMeta}>
              <span style={s.chip}>{ICONS[idea.platform]} {idea.platform}</span>
              <span style={s.chip}>{idea.format}</span>
            </div>
            <p style={s.cardTitle}>{idea.title}</p>
            {idea.campaign && <p style={s.campaignTag}>🚩 {idea.campaign}</p>}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={s.empty}>
            <p style={{ fontSize: 40 }}>💡</p>
            <p style={{ color: '#555', fontSize: 16, fontWeight: 600 }}>No ideas match</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

function Chip({ children, active, onClick }) {
  return <button style={{ ...s.filterChip, ...(active ? s.filterChipActive : {}) }} onClick={onClick}>{children}</button>
}

const s = {
  filterLabel: { color: '#555', fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  filterChip: { padding: '6px 12px', borderRadius: 16, border: '1px solid #2a2a2a', background: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' },
  filterChipActive: { background: '#fff', borderColor: '#fff', color: '#000', fontWeight: 600 },
  card: { background: '#111', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #1e1e1e' },
  cardMeta: { display: 'flex', gap: 8, marginBottom: 10 },
  chip: { background: '#1e1e1e', padding: '3px 8px', borderRadius: 6, color: '#888', fontSize: 11, textTransform: 'capitalize' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 8 },
  campaignTag: { color: '#555', fontSize: 11 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 12 },
}
