import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlatformBadge } from '../components/PlatformIcon';
import { BRANDS } from '../data/mockData';

export default function BrandWorkspaceScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { brandId } = route.params;
  const brand = BRANDS.find(b => b.id === brandId);
  const phase = brand.currentPhase;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={brand.bannerColor} style={[styles.headerBanner, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.brandName}>{brand.name}</Text>
          {brand.tagline ? <Text style={styles.tagline}>{brand.tagline}</Text> : null}
          <View style={styles.statsRow}>
            {brand.stats.map((s, i) => (
              <React.Fragment key={s.platform}>
                <PlatformBadge platform={s.platform} count={s.count} />
                {i < brand.stats.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

        {/* Current Phase Card */}
        <SectionCard
          title="CURRENT PHASE"
          onPress={() => navigation.navigate('CurrentPhase', { brandId })}
        >
          <Text style={styles.phaseName}>{phase.name}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${phase.progress}%` }]} />
            </View>
            <Text style={styles.progressPct}>{phase.progress}%</Text>
          </View>
          <View style={styles.phaseMetaRow}>
            <MetaPill icon="checkmark-circle-outline" label={`${phase.postsCompleted}/${phase.totalPosts} posts`} />
            <MetaPill icon="calendar-outline" label={`Ends ${phase.eosDate}`} />
          </View>
          <View style={styles.nextRow}>
            <Text style={styles.nextLabel}>Next:</Text>
            <Text style={styles.nextValue}>{phase.next}</Text>
            <Ionicons name="arrow-forward" size={14} color="#888" />
          </View>
        </SectionCard>

        {/* Overview Card */}
        <SectionCard
          title="OVERVIEW"
          onPress={() => navigation.navigate('Overview', { brandId })}
          label="Brand Playbook"
        >
          <View style={styles.overviewGrid}>
            <OverviewItem label="Mission" value={brand.overview.mission} clamp={2} />
            <OverviewItem label="Audience" value={brand.overview.audience} clamp={1} />
            <OverviewItem label="Voice" value={brand.overview.brandVoice} clamp={1} />
          </View>
          <View style={styles.pillarsRow}>
            {brand.overview.contentPillars.slice(0, 3).map(p => (
              <View key={p} style={styles.pillarTag}>
                <Text style={styles.pillarText}>{p}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Platform Strategy Card */}
        <SectionCard
          title="PLATFORM STRATEGY"
          onPress={() => navigation.navigate('PlatformStrategy', { brandId })}
          label="Platform Operating Manual"
        >
          <View style={styles.platformList}>
            {brand.stats.map(s => (
              <View key={s.platform} style={styles.platformRow}>
                <PlatformBadge platform={s.platform} count={s.count} />
                <Text style={styles.platformObjText} numberOfLines={1}>
                  {brand.platformStrategy[s.platform]?.objective || '—'}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#555" />
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Inspiration Gallery Card */}
        <SectionCard
          title="INSPIRATION GALLERY"
          onPress={() => navigation.navigate('Inspiration', { brandId })}
          label="Reference Board"
        >
          {brand.inspiration.slice(0, 2).map(item => (
            <View key={item.id} style={styles.inspirationItem}>
              <Ionicons
                name={item.type === 'link' ? 'link-outline' : 'document-text-outline'}
                size={14}
                color="#888"
              />
              <Text style={styles.inspirationText} numberOfLines={2}>
                {item.content}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Idea Vault Card */}
        <SectionCard
          title="IDEA VAULT"
          onPress={() => navigation.navigate('IdeaVault', { brandId })}
          label={`${brand.ideas.length} ideas stored`}
        >
          <View style={styles.platformIconsRow}>
            {brand.stats.map(s => (
              <View key={s.platform} style={styles.platformIconChip}>
                <PlatformBadge platform={s.platform} count={brand.ideas.filter(i => i.platform === s.platform).length.toString()} />
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Season Card */}
        <SectionCard
          title="SEASON"
          onPress={() => navigation.navigate('Season', { brandId })}
          label={brand.season.name}
        >
          <Text style={styles.seasonGoal} numberOfLines={2}>{brand.season.goal}</Text>
          <View style={styles.roadmapPreview}>
            {brand.season.roadmap.map((r, i) => (
              <View key={r} style={styles.roadmapItem}>
                <View style={styles.roadmapDot} />
                <Text style={styles.roadmapText}>{r}</Text>
                {i < brand.season.roadmap.length - 1 && <View style={styles.roadmapLine} />}
              </View>
            ))}
          </View>
        </SectionCard>

      </ScrollView>
    </View>
  );
}

function SectionCard({ title, children, onPress, label }) {
  return (
    <TouchableOpacity style={styles.sectionCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.sectionCardHeader}>
        <Text style={styles.sectionCardTitle}>{title}</Text>
        <View style={styles.sectionCardRight}>
          {label ? <Text style={styles.sectionCardLabel}>{label}</Text> : null}
          <Ionicons name="chevron-forward" size={14} color="#555" />
        </View>
      </View>
      {children}
    </TouchableOpacity>
  );
}

function MetaPill({ icon, label }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={12} color="#888" />
      <Text style={styles.metaPillText}>{label}</Text>
    </View>
  );
}

function OverviewItem({ label, value, clamp }) {
  return (
    <View style={styles.overviewItem}>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={styles.overviewValue} numberOfLines={clamp}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerBanner: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: { alignItems: 'center' },
  brandName: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionCardTitle: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
  },
  sectionCardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionCardLabel: { color: '#555', fontSize: 11 },
  phaseName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressTrack: { flex: 1, height: 4, backgroundColor: '#222', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
  progressPct: { color: '#888', fontSize: 12 },
  phaseMetaRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  metaPillText: { color: '#888', fontSize: 11 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextLabel: { color: '#555', fontSize: 12 },
  nextValue: { color: '#aaa', fontSize: 12 },
  overviewGrid: { gap: 10, marginBottom: 12 },
  overviewItem: { gap: 2 },
  overviewLabel: { color: '#555', fontSize: 10, letterSpacing: 1 },
  overviewValue: { color: '#ccc', fontSize: 13 },
  pillarsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pillarTag: {
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillarText: { color: '#888', fontSize: 11 },
  platformList: { gap: 12 },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformObjText: { flex: 1, color: '#aaa', fontSize: 12 },
  inspirationItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  inspirationText: { color: '#aaa', fontSize: 13, flex: 1 },
  platformIconsRow: { flexDirection: 'row', gap: 20 },
  platformIconChip: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  seasonGoal: { color: '#aaa', fontSize: 13, marginBottom: 14 },
  roadmapPreview: { gap: 0 },
  roadmapItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  roadmapDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  roadmapText: { color: '#ccc', fontSize: 13 },
  roadmapLine: {},
});
