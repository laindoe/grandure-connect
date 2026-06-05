import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import IdeaCaptureBar from '../components/IdeaCaptureBar'
import { BRANDS } from '../data/mockData'

const PLATFORM_ICONS = { instagram: '◻', threads: '@', youtube: '▶' }

export default function BrandWorkspace() {
  const { id } = useParams()
  const nav = useNavigate()
  const brand = BRANDS.find(b => b.id === id)
  const phase = brand.currentPhase

  return (
    <Layout footer={<IdeaCaptureBar />}>
      <div style={{ ...s.banner, background: brand.bannerGradient }}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <p style={s.brandName}>{brand.name}</p>
        {brand.tagline && <p style={s.tagline}>{brand.tagline}</p>}
        <div style={s.statsRow}>
          {brand.stats.map((st, i) => (
            <React.Fragment key={st.platform}>
              <div style={s.stat}>
                <span>{PLATFORM_ICONS[st.platform]}</span>
                <span style={s.statCount}>{st.count}</span>
              </div>
              {i < brand.stats.length - 1 && <div style={s.statDiv} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 24px' }}>
        <Card title="CURRENT PHASE" label="Active Campaign" onClick={() => nav(`/brand/${id}/phase`)}>
          <p style={s.phaseName}>{phase.name}</p>
          <div style={s.progressRow}>
            <div style={s.track}><div style={{ ...s.fill, width: `${phase.progress}%` }} /></div>
            <span style={s.pct}>{phase.progress}%</span>
          </div>
          <div style={s.pills}>
            <Pill>✓ {phase.postsCompleted}/{phase.totalPosts} posts</Pill>
            <Pill>📅 Ends {phase.eosDate}</Pill>
          </div>
          <p style={s.nextRow}>Next: <span style={{ color: '#aaa' }}>{phase.next}</span> →</p>
        </Card>

        <Card title="OVERVIEW" label="Brand Playbook" onClick={() => nav(`/brand/${id}/overview`)}>
          <p style={s.bodyText}>{brand.overview.mission.slice(0, 100)}...</p>
          <div style={s.tagWrap}>
            {brand.overview.contentPillars.slice(0, 3).map(p => <span key={p} style={s.tag}>{p}</span>)}
          </div>
        </Card>

        <Card title="PLATFORM STRATEGY" label="Per-Platform Plans" onClick={() => nav(`/brand/${id}/platforms`)}>
          {brand.stats.map(st => (
            <div key={st.platform} style={s.platformRow}>
              <span>{PLATFORM_ICONS[st.platform]} {st.platform}</span>
              <span style={{ color: '#666', fontSize: 12 }}>{brand.platformStrategy[st.platform]?.objective?.slice(0, 40)}...</span>
            </div>
          ))}
        </Card>

        <Card title="INSPIRATION GALLERY" label="Reference Board" onClick={() => nav(`/brand/${id}/inspiration`)}>
          {brand.inspiration.slice(0, 2).map(item => (
            <p key={item.id} style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>{item.content}</p>
          ))}
        </Card>

        <Card title="IDEA VAULT" label={`${brand.ideas.length} ideas`} onClick={() => nav(`/brand/${id}/ideas`)}>
          <div style={s.tagWrap}>
            {brand.stats.map(st => (
              <span key={st.platform} style={s.tag}>{PLATFORM_ICONS[st.platform]} {brand.ideas.filter(i => i.platform === st.platform).length}</span>
            ))}
          </div>
        </Card>

        <Card title="SEASON" label={brand.season.name} onClick={() => nav(`/brand/${id}/season`)}>
          <p style={s.bodyText}>{brand.season.goal.slice(0, 100)}...</p>
        </Card>
      </div>
    </Layout>
  )
}

function Card({ title, label, children, onClick }) {
  return (
    <div style={s.card} onClick={onClick}>
      <div style={s.cardHeader}>
        <span style={s.cardTitle}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <span style={s.cardLabel}>{label}</span>}
          <span style={{ color: '#555' }}>›</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function Pill({ children }) {
  return <span style={s.pill}>{children}</span>
}

const s = {
  banner: { padding: '52px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  back: { alignSelf: 'flex-start', width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', marginBottom: 16 },
  brandName: { color: '#fff', fontSize: 28, fontWeight: 800 },
  tagline: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  statsRow: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, background: 'rgba(0,0,0,0.2)', padding: '10px 20px', borderRadius: 20 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#fff' },
  statCount: { fontSize: 12, fontWeight: 600 },
  statDiv: { width: 1, height: 24, background: 'rgba(255,255,255,0.2)' },
  card: { background: '#111', borderRadius: 16, padding: 18, marginBottom: 14, border: '1px solid #1e1e1e', cursor: 'pointer' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { color: '#666', fontSize: 10, letterSpacing: 2, fontWeight: 600 },
  cardLabel: { color: '#555', fontSize: 11 },
  phaseName: { color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 12 },
  progressRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  track: { flex: 1, height: 4, background: '#222', borderRadius: 2 },
  fill: { height: 4, background: '#fff', borderRadius: 2 },
  pct: { color: '#888', fontSize: 12 },
  pills: { display: 'flex', gap: 8, marginBottom: 10 },
  pill: { display: 'flex', alignItems: 'center', gap: 5, background: '#1e1e1e', padding: '4px 10px', borderRadius: 10, color: '#888', fontSize: 11 },
  nextRow: { color: '#555', fontSize: 12 },
  bodyText: { color: '#ccc', fontSize: 13, lineHeight: 1.6, marginBottom: 10 },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tag: { background: '#1e1e1e', padding: '4px 10px', borderRadius: 8, color: '#888', fontSize: 11 },
  platformRow: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10, color: '#ccc', fontSize: 13 },
}
