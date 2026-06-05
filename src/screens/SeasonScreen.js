import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDS } from '../data/mockData';

export default function SeasonScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { brandId } = route.params;
  const brand = BRANDS.find(b => b.id === brandId);
  const season = brand.season;

  return (
    <View style={styles.container}>
      <LinearGradient colors={brand.bannerColor} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>SEASON</Text>
          <Text style={styles.seasonName}>{season.name}</Text>
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Season Goal */}
        <View style={styles.section}>
          <SectionHeader icon="flag-outline" title="SEASON GOAL" />
          <Text style={styles.goalText}>{season.goal}</Text>
        </View>

        {/* Season Pillars */}
        <View style={styles.section}>
          <SectionHeader icon="grid-outline" title="SEASON PILLARS" />
          <View style={styles.pillarsGrid}>
            {season.pillars.map((p, i) => (
              <View key={p} style={styles.pillarCard}>
                <Text style={styles.pillarNum}>{i + 1}</Text>
                <Text style={styles.pillarText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Campaign Roadmap */}
        <View style={styles.section}>
          <SectionHeader icon="map-outline" title="CAMPAIGN ROADMAP" />
          <View style={styles.roadmap}>
            {season.roadmap.map((name, i) => {
              const campaign = brand.campaigns.find(c => c.name === name);
              return (
                <View key={name} style={styles.roadmapItem}>
                  <View style={styles.roadmapLeft}>
                    <View style={[styles.roadmapNode, campaign?.status === 'active' && styles.roadmapNodeActive]} />
                    {i < season.roadmap.length - 1 && <View style={styles.roadmapConnector} />}
                  </View>
                  <View style={[styles.roadmapCard, campaign?.status === 'active' && styles.roadmapCardActive]}>
                    {campaign?.status === 'active' && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                    <Text style={styles.roadmapName}>{name}</Text>
                    {campaign && (
                      <Text style={styles.roadmapDates}>
                        {campaign.startDate} → {campaign.endDate}
                      </Text>
                    )}
                    {campaign && (
                      <View style={styles.roadmapPhase}>
                        <Text style={styles.roadmapPhaseText}>{campaign.phase}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Active Campaigns */}
        <View style={styles.section}>
          <SectionHeader icon="flash-outline" title="ACTIVE CAMPAIGNS" />
          {brand.campaigns.filter(c => c.status === 'active').map(c => (
            <TouchableOpacity
              key={c.id}
              style={styles.activeCampaign}
              onPress={() => navigation.navigate('CurrentPhase', { brandId })}
            >
              <View>
                <Text style={styles.activeCampaignName}>{c.name}</Text>
                <Text style={styles.activeCampaignMeta}>{c.phase} · {c.startDate} → {c.endDate}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color="#888" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
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
  headerContent: {},
  headerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  seasonName: { color: '#fff', fontSize: 28, fontWeight: '800' },
  brandName: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  scroll: { flex: 1 },
  section: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { color: '#666', fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  goalText: { color: '#ccc', fontSize: 15, lineHeight: 24 },
  pillarsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pillarCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  pillarNum: { color: '#555', fontSize: 20, fontWeight: '800' },
  pillarText: { color: '#ccc', fontSize: 13 },
  roadmap: { gap: 0 },
  roadmapItem: { flexDirection: 'row', gap: 14 },
  roadmapLeft: { alignItems: 'center', width: 16 },
  roadmapNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
    marginTop: 16,
  },
  roadmapNodeActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  roadmapConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#222',
    marginVertical: 4,
  },
  roadmapCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  roadmapCardActive: {
    borderColor: '#fff',
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  activeBadgeText: { color: '#000', fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  roadmapName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  roadmapDates: { color: '#666', fontSize: 11, marginBottom: 8 },
  roadmapPhase: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roadmapPhaseText: { color: '#888', fontSize: 10, letterSpacing: 0.5 },
  activeCampaign: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
  },
  activeCampaignName: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  activeCampaignMeta: { color: '#666', fontSize: 12 },
});
