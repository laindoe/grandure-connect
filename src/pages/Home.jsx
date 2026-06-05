import React from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import IdeaCaptureBar from '../components/IdeaCaptureBar'
import { BRANDS } from '../data/mockData'

const PLATFORM_ICONS = { instagram: '◻', threads: '@', youtube: '▶' }

export default function Home() {
  const nav = useNavigate()
  return (
    <Layout footer={<IdeaCaptureBar />}>
      <div style={s.header}>
        <button style={s.iconBtn}>☰</button>
        <div style={{ textAlign: 'center' }}>
          <div style={s.logoTop}>GRANDURE</div>
          <div style={s.logoBottom}>connect</div>
        </div>
        <button style={s.iconBtn}>◯</button>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <p style={s.sectionLabel}>PROFILES</p>

        {BRANDS.map(brand => (
          <div key={brand.id} style={s.card} onClick={() => nav(`/brand/${brand.id}`)}>
            <div style={{ ...s.banner, background: brand.bannerGradient }}>
              <p style={s.brandName}>{brand.name}</p>
              {brand.tagline && <p style={s.tagline}>{brand.tagline}</p>}
            </div>
            <div style={s.cardBottom}>
              <div style={s.statsRow}>
                {brand.stats.map((st, i) => (
                  <React.Fragment key={st.platform}>
                    <div style={s.stat}>
                      <span style={s.statIcon}>{PLATFORM_ICONS[st.platform] || '•'}</span>
                      <span style={s.statCount}>{st.count}</span>
                    </div>
                    {i < brand.stats.length - 1 && <div style={s.divider} />}
                  </React.Fragment>
                ))}
              </div>
              <div style={s.phaseDivider} />
              <div style={s.phaseSection}>
                <div>
                  <p style={s.phaseLabel}>CURRENT PHASE</p>
                  <p style={s.phaseName}>{brand.currentPhase.name}</p>
                  <p style={s.phaseNext}>Next: {brand.currentPhase.next}</p>
                </div>
                <span style={{ color: '#888' }}>→</span>
              </div>
            </div>
          </div>
        ))}

        <div style={s.addCard} onClick={() => {}}>
          <div style={s.addIcon}>+</div>
          <div>
            <p style={s.addTitle}>Add New Profile</p>
            <p style={s.addSub}>Start tracking a new brand or project.</p>
          </div>
          <span style={{ color: '#555', marginLeft: 'auto' }}>›</span>
        </div>
      </div>
    </Layout>
  )
}

const s = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px' },
  iconBtn: { width: 42, height: 42, borderRadius: 21, background: '#1a1a1a', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoTop: { color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: 6 },
  logoBottom: { color: '#fff', fontSize: 12, letterSpacing: 8 },
  sectionLabel: { color: '#666', fontSize: 11, letterSpacing: 2, marginBottom: 14, marginTop: 4 },
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: '#111', cursor: 'pointer' },
  banner: { padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  brandName: { color: '#fff', fontSize: 32, fontWeight: 800, textAlign: 'center' },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 4 },
  cardBottom: { display: 'flex', alignItems: 'center', padding: '14px 18px' },
  statsRow: { display: 'flex', alignItems: 'center', gap: 12 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  statIcon: { color: '#fff', fontSize: 18 },
  statCount: { color: '#fff', fontSize: 12, fontWeight: 600 },
  divider: { width: 1, height: 28, background: '#333' },
  phaseDivider: { width: 1, height: 40, background: '#333', margin: '0 16px' },
  phaseSection: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  phaseLabel: { color: '#666', fontSize: 9, letterSpacing: 1.5, marginBottom: 3 },
  phaseName: { color: '#fff', fontSize: 13, fontWeight: 600 },
  phaseNext: { color: '#888', fontSize: 11, marginTop: 2 },
  addCard: { display: 'flex', alignItems: 'center', background: '#111', borderRadius: 16, padding: 18, gap: 14, border: '1px solid #222', cursor: 'pointer' },
  addIcon: { width: 44, height: 44, borderRadius: 22, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22 },
  addTitle: { color: '#fff', fontSize: 15, fontWeight: 600 },
  addSub: { color: '#666', fontSize: 12, marginTop: 2 },
}
