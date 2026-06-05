import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import IdeaCaptureBar from '../components/IdeaCaptureBar'
import { BRANDS } from '../data/mockData'

const PHASES = [
  { key: 'Awareness', color: '#4A90D9' },
  { key: 'Engagement', color: '#7B68EE' },
  { key: 'Conversion', color: '#FF6B6B' },
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BOARD_COLS = [
  { key: 'ideas', label: 'Ideas', color: '#9E9E9E' },
  { key: 'drafting', label: 'Drafting', color: '#FF9800' },
  { key: 'ready', label: 'Ready', color: '#4CAF50' },
  { key: 'posted', label: 'Posted', color: '#4A90D9' },
]

export default function CurrentPhase() {
  const { id } = useParams()
  const nav = useNavigate()
  const brand = BRANDS.find(b => b.id === id)
  const phase = brand.currentPhase
  const [tab, setTab] = useState('Timeline')
  const [day, setDay] = useState('Mon')

  return (
    <Layout footer={<IdeaCaptureBar />}>
      <div style={{ ...s.header, background: brand.bannerGradient }}>
        <div style={s.headerTop}>
          <button style={s.back} onClick={() => nav(-1)}>←</button>
          <span style={s.headerLabel}>CURRENT PHASE</span>
          <div style={{ width: 36 }} />
        </div>
        <p style={s.phaseName}>{phase.name}</p>
        <div style={s.progressRow}>
          <div style={s.track}><div style={{ ...s.fill, width: `${phase.progress}%` }} /></div>
          <span style={s.pct}>{phase.progress}%</span>
        </div>
        <div style={s.pills}>
          <span style={s.pill}>✓ {phase.postsCompleted}/{phase.totalPosts} posts</span>
          <span style={s.pill}>Ends {phase.eosDate}</span>
          <span style={s.pill}>Next: {phase.next}</span>
        </div>
      </div>

      <div style={s.tabs}>
        {['Timeline', 'Board', 'Calendar'].map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div style={{ padding: 20, overflowY: 'auto' }}>
        {tab === 'Timeline' && (
          <>
            <p style={s.sectionTitle}>Campaign Timeline</p>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>{brand.season.name}</p>
            {PHASES.map(ph => {
              const campaigns = brand.campaigns.filter(c => c.phase === ph.key)
              return (
                <div key={ph.key} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: ph.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: ph.color }} />
                    </div>
                    <span style={{ color: ph.color, fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{ph.key}</span>
                  </div>
                  {campaigns.length === 0
                    ? <div style={s.emptyCard}><span style={{ color: '#444' }}>No campaigns in this phase</span></div>
                    : campaigns.map(c => (
                      <div key={c.id} style={{ ...s.campaignCard, ...(c.status === 'active' ? { borderColor: '#fff' } : {}) }}>
                        {c.status === 'active' && <span style={s.activeBadge}>ACTIVE</span>}
                        <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{c.name}</p>
                        <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>{c.startDate} → {c.endDate}</p>
                        <span style={{ ...s.statusBadge, color: c.status === 'active' ? '#4CAF50' : c.status === 'upcoming' ? '#FF9800' : '#9E9E9E', background: (c.status === 'active' ? '#4CAF50' : c.status === 'upcoming' ? '#FF9800' : '#9E9E9E') + '22' }}>
                          {c.status}
                        </span>
                      </div>
                    ))
                  }
                </div>
              )
            })}
          </>
        )}

        {tab === 'Board' && BOARD_COLS.map(col => (
          <div key={col.key} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: col.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: col.color }} />
              </div>
              <span style={{ color: col.color, fontSize: 13, fontWeight: 700, flex: 1 }}>{col.label}</span>
              <span style={s.countBadge}>{(brand.board[col.key] || []).length}</span>
            </div>
            {(brand.board[col.key] || []).length === 0
              ? <div style={s.emptyCard}><span style={{ color: '#333' }}>Nothing here yet</span></div>
              : (brand.board[col.key] || []).map(item => (
                <div key={item.id} style={s.boardCard}>
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{item.title}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={s.chip}>{item.platform}</span>
                    <span style={s.chip}>{item.format}</span>
                  </div>
                </div>
              ))
            }
          </div>
        ))}

        {tab === 'Calendar' && (
          <>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
              {DAYS.map(d => (
                <button key={d} style={{ ...s.dayBtn, ...(day === d ? s.dayBtnActive : {}) }} onClick={() => setDay(d)}>{d}</button>
              ))}
            </div>
            <p style={s.sectionTitle}>{day}</p>
            <div style={{ ...s.emptyCard, flexDirection: 'column', gap: 8, padding: '40px 20px' }}>
              <span style={{ fontSize: 32 }}>📅</span>
              <span style={{ color: '#555', fontSize: 16, fontWeight: 600 }}>Nothing scheduled</span>
              <span style={{ color: '#333', fontSize: 13 }}>Tap + to add content to this day</span>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

const s = {
  header: { padding: '52px 20px 20px' },
  headerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  back: { width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' },
  headerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2 },
  phaseName: { color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 14 },
  progressRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  track: { flex: 1, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  fill: { height: 6, background: '#fff', borderRadius: 3 },
  pct: { color: '#fff', fontSize: 14, fontWeight: 600 },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: { background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: 12, color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  tabs: { display: 'flex', background: '#111', borderBottom: '1px solid #222' },
  tab: { flex: 1, padding: '14px 0', background: 'none', border: 'none', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  tabActive: { color: '#fff', borderBottom: '2px solid #fff' },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 4 },
  emptyCard: { background: '#0a0a0a', borderRadius: 12, padding: 16, border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  campaignCard: { background: '#111', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #222' },
  activeBadge: { background: '#fff', color: '#000', fontSize: 9, fontWeight: 800, letterSpacing: 1.5, padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginBottom: 8 },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, display: 'inline-block' },
  countBadge: { background: '#1e1e1e', color: '#888', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 },
  boardCard: { background: '#111', borderRadius: 12, padding: 14, marginBottom: 8, border: '1px solid #1e1e1e' },
  chip: { background: '#1e1e1e', padding: '3px 8px', borderRadius: 6, color: '#888', fontSize: 11 },
  dayBtn: { padding: '8px 14px', borderRadius: 12, background: 'none', border: 'none', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  dayBtnActive: { background: '#fff', color: '#000' },
}
