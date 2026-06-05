import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import IdeaCaptureBar from '../components/IdeaCaptureBar'
import { BRANDS } from '../data/mockData'

export default function Season() {
  const { id } = useParams()
  const nav = useNavigate()
  const brand = BRANDS.find(b => b.id === id)
  const season = brand.season

  return (
    <Layout footer={<IdeaCaptureBar />}>
      <div style={{ ...s.header, background: brand.bannerGradient }}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <p style={s.seasonLabel}>SEASON</p>
        <p style={s.seasonName}>{season.name}</p>
        <p style={s.brandName}>{brand.name}</p>
      </div>

      <div style={{ padding: 20 }}>
        <Card title="SEASON GOAL">
          <p style={s.body}>{season.goal}</p>
        </Card>

        <Card title="SEASON PILLARS">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {season.pillars.map((p, i) => (
              <div key={p} style={s.pillarCard}>
                <p style={s.pillarNum}>{i + 1}</p>
                <p style={s.body}>{p}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="CAMPAIGN ROADMAP">
          {season.roadmap.map((name, i) => {
            const campaign = brand.campaigns.find(c => c.name === name)
            return (
              <div key={name} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                  <div style={{ ...s.node, ...(campaign?.status === 'active' ? s.nodeActive : {}) }} />
                  {i < season.roadmap.length - 1 && <div style={s.connector} />}
                </div>
                <div style={{ ...s.roadmapCard, ...(campaign?.status === 'active' ? { borderColor: '#fff' } : {}), flex: 1 }}>
                  {campaign?.status === 'active' && <span style={s.activeBadge}>ACTIVE</span>}
                  <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{name}</p>
                  {campaign && <p style={{ color: '#666', fontSize: 11, marginBottom: 6 }}>{campaign.startDate} → {campaign.endDate}</p>}
                  {campaign && <span style={s.phaseTag}>{campaign.phase}</span>}
                </div>
              </div>
            )
          })}
        </Card>

        <Card title="ACTIVE CAMPAIGNS">
          {brand.campaigns.filter(c => c.status === 'active').map(c => (
            <div key={c.id} style={s.activeCampaign} onClick={() => nav(`/brand/${id}/phase`)}>
              <div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.name}</p>
                <p style={{ color: '#666', fontSize: 12 }}>{c.phase} · {c.startDate} → {c.endDate}</p>
              </div>
              <span style={{ color: '#555' }}>›</span>
            </div>
          ))}
        </Card>
      </div>
    </Layout>
  )
}

function Card({ title, children }) {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>{title}</p>
      {children}
    </div>
  )
}

const s = {
  header: { padding: '52px 20px 24px' },
  back: { width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', marginBottom: 16 },
  seasonLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  seasonName: { color: '#fff', fontSize: 28, fontWeight: 800 },
  brandName: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  card: { background: '#111', borderRadius: 16, padding: 18, marginBottom: 14, border: '1px solid #1e1e1e' },
  cardTitle: { color: '#666', fontSize: 10, letterSpacing: 2, fontWeight: 600, marginBottom: 14 },
  body: { color: '#ccc', fontSize: 14, lineHeight: 1.7 },
  pillarCard: { background: '#1a1a1a', borderRadius: 12, padding: 14, flex: '1 1 45%' },
  pillarNum: { color: '#555', fontSize: 20, fontWeight: 800, marginBottom: 8 },
  node: { width: 14, height: 14, borderRadius: 7, background: '#333', border: '2px solid #555', marginTop: 16, flexShrink: 0 },
  nodeActive: { background: '#fff', borderColor: '#fff' },
  connector: { flex: 1, width: 2, background: '#222', margin: '4px 0' },
  roadmapCard: { background: '#1a1a1a', borderRadius: 12, padding: 14, border: '1px solid #222' },
  activeBadge: { background: '#fff', color: '#000', fontSize: 8, fontWeight: 800, letterSpacing: 1.5, padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginBottom: 6 },
  phaseTag: { background: '#1e1e1e', color: '#888', fontSize: 10, padding: '3px 8px', borderRadius: 6, display: 'inline-block' },
  activeCampaign: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: 12, padding: 14, cursor: 'pointer' },
}
