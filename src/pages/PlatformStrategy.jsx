import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import BackHeader from '../components/BackHeader'
import IdeaCaptureBar from '../components/IdeaCaptureBar'
import { BRANDS } from '../data/mockData'

const ICONS = { instagram: '◻', threads: '@', youtube: '▶', newsletter: '✉', blog: '📝' }
const LABELS = { instagram: 'Instagram', threads: 'Threads', youtube: 'YouTube', newsletter: 'Newsletter', blog: 'Blog' }

export default function PlatformStrategy() {
  const { id } = useParams()
  const brand = BRANDS.find(b => b.id === id)
  const platforms = brand.stats.map(s => s.platform)
  const [active, setActive] = useState(platforms[0])
  const strategy = brand.platformStrategy[active]

  return (
    <Layout footer={<IdeaCaptureBar />}>
      <BackHeader label="PLATFORM STRATEGY" title={brand.name} />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px', borderBottom: '1px solid #1a1a1a' }}>
        {platforms.map(p => (
          <button key={p} style={{ ...s.tab, ...(active === p ? s.tabActive : {}) }} onClick={() => setActive(p)}>
            <span>{ICONS[p]}</span> {LABELS[p]}
          </button>
        ))}
      </div>

      {strategy ? (
        <div style={{ padding: 20 }}>
          <Section title="Objective"><p style={s.body}>{strategy.objective}</p></Section>
          <Section title="Themes">
            {strategy.themes.map((t, i) => <p key={i} style={{ ...s.body, marginBottom: 8 }}>• {t}</p>)}
          </Section>
          <Section title="Formats">
            <div style={s.tagWrap}>{strategy.formats.map(f => <span key={f} style={s.tag}>{f}</span>)}</div>
          </Section>
          <Section title="Goals">
            {strategy.goals.map((g, i) => (
              <div key={i} style={s.goalRow}>
                <div style={s.check}>✓</div>
                <p style={s.body}>{g}</p>
              </div>
            ))}
          </Section>
        </div>
      ) : (
        <div style={s.empty}>
          <p style={{ fontSize: 40 }}>{ICONS[active]}</p>
          <p style={{ color: '#555', fontSize: 16, fontWeight: 600 }}>No strategy yet</p>
        </div>
      )}
    </Layout>
  )
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <p style={s.sectionTitle}>{title}</p>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

const s = {
  tab: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: '1px solid #2a2a2a', background: 'none', color: '#888', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive: { background: '#fff', borderColor: '#fff', color: '#000', fontWeight: 600 },
  body: { color: '#ccc', fontSize: 14, lineHeight: 1.7 },
  section: { background: '#111', borderRadius: 16, marginBottom: 14, border: '1px solid #1e1e1e', overflow: 'hidden' },
  sectionTitle: { color: '#888', fontSize: 11, letterSpacing: 1.5, fontWeight: 600, padding: '14px 14px 0' },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { background: '#1e1e1e', padding: '6px 12px', borderRadius: 8, color: '#aaa', fontSize: 12 },
  goalRow: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  check: { width: 20, height: 20, borderRadius: 10, background: '#fff', color: '#000', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
}
