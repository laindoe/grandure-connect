import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import BackHeader from '../components/BackHeader'
import IdeaCaptureBar from '../components/IdeaCaptureBar'
import { BRANDS } from '../data/mockData'

export default function Overview() {
  const { id } = useParams()
  const nav = useNavigate()
  const brand = BRANDS.find(b => b.id === id)
  const o = brand.overview

  return (
    <Layout footer={<IdeaCaptureBar />}>
      <BackHeader label="OVERVIEW" title={brand.name} />
      <div style={{ padding: 20 }}>
        <Section icon="🚩" title="Mission"><p style={s.body}>{o.mission}</p></Section>
        <Section icon="👥" title="Audience"><p style={s.body}>{o.audience}</p></Section>
        <Section icon="📍" title="Positioning"><p style={s.body}>{o.positioning}</p></Section>
        <Section icon="🎙" title="Brand Voice"><p style={s.body}>{o.brandVoice}</p></Section>
        <Section icon="🏷" title="Keywords">
          <div style={s.tagWrap}>{o.keywords.map(k => <span key={k} style={s.tag}>{k}</span>)}</div>
        </Section>
        <Section icon="⬛" title="Content Pillars">
          {o.contentPillars.map((p, i) => (
            <div key={p} style={s.pillarRow}>
              <div style={s.pillarNum}>{i + 1}</div>
              <span style={s.body}>{p}</span>
            </div>
          ))}
        </Section>
        <Section icon="🛍" title="Offers">
          {o.offers.map(offer => <p key={offer} style={{ ...s.body, marginBottom: 8 }}>→ {offer}</p>)}
        </Section>
        <button style={s.platformBtn} onClick={() => nav(`/brand/${id}/platforms`)}>
          <div>
            <p style={s.platformBtnLabel}>PLATFORM STRATEGY</p>
            <p style={s.platformBtnSub}>View platform-specific plans →</p>
          </div>
        </button>
      </div>
    </Layout>
  )
}

function Section({ icon, title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <span>{icon}</span>
        <span style={s.sectionTitle}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

const s = {
  body: { color: '#ccc', fontSize: 14, lineHeight: 1.7 },
  section: { background: '#111', borderRadius: 16, marginBottom: 14, border: '1px solid #1e1e1e', overflow: 'hidden' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderBottom: '1px solid #1e1e1e' },
  sectionTitle: { color: '#888', fontSize: 11, letterSpacing: 1.5, fontWeight: 600 },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { background: '#1e1e1e', padding: '5px 12px', borderRadius: 20, color: '#888', fontSize: 12 },
  pillarRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  pillarNum: { width: 24, height: 24, borderRadius: 12, background: '#fff', color: '#000', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  platformBtn: { width: '100%', background: '#111', borderRadius: 16, padding: 18, border: '1px solid #fff', cursor: 'pointer', textAlign: 'left', marginBottom: 24 },
  platformBtnLabel: { color: '#666', fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  platformBtnSub: { color: '#fff', fontSize: 14, fontWeight: 600 },
}
