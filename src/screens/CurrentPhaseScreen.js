import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDS } from '../data/mockData';
import TimelineView from './TimelineView';
import BoardView from './BoardView';
import CalendarView from './CalendarView';

const TABS = ['Timeline', 'Board', 'Calendar'];

export default function CurrentPhaseScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { brandId } = route.params;
  const brand = BRANDS.find(b => b.id === brandId);
  const phase = brand.currentPhase;
  const [activeTab, setActiveTab] = useState('Timeline');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={brand.bannerColor} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerLabel}>CURRENT PHASE</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.phaseName}>{phase.name}</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${phase.progress}%` }]} />
          </View>
          <Text style={styles.progressPct}>{phase.progress}%</Text>
        </View>

        <View style={styles.metaRow}>
          <MetaPill icon="checkmark-circle-outline" label={`${phase.postsCompleted}/${phase.totalPosts} posts`} />
          <MetaPill icon="calendar-outline" label={`Ends ${phase.eosDate}`} />
          <MetaPill icon="arrow-forward-circle-outline" label={`Next: ${phase.next}`} />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'Timeline' && <TimelineView brand={brand} />}
      {activeTab === 'Board' && <BoardView brand={brand} />}
      {activeTab === 'Calendar' && <CalendarView brand={brand} />}
    </View>
  );
}

function MetaPill({ icon, label }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.7)" />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2 },
  phaseName: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  progressTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  progressPct: { color: '#fff', fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pillText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: { color: '#555', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
});
