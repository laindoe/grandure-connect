import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlatformIcon from '../components/PlatformIcon';
import { BRANDS } from '../data/mockData';

const ALL_PLATFORMS = ['All', 'instagram', 'threads', 'youtube'];
const ALL_FORMATS = ['All', 'Reel', 'Carousel', 'Thread', 'Long-form'];

export default function IdeaVaultScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { brandId } = route.params;
  const brand = BRANDS.find(b => b.id === brandId);
  const [platformFilter, setPlatformFilter] = useState('All');
  const [formatFilter, setFormatFilter] = useState('All');

  const filtered = brand.ideas.filter(idea => {
    const pMatch = platformFilter === 'All' || idea.platform === platformFilter;
    const fMatch = formatFilter === 'All' || idea.format === formatFilter;
    return pMatch && fMatch;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>IDEA VAULT</Text>
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <Text style={styles.filterLabel}>Platform</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {ALL_PLATFORMS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.filterChip, platformFilter === p && styles.filterChipActive]}
              onPress={() => setPlatformFilter(p)}
            >
              {p !== 'All' && <PlatformIcon platform={p} size={12} color={platformFilter === p ? '#000' : '#888'} />}
              <Text style={[styles.filterChipText, platformFilter === p && styles.filterChipTextActive]}>
                {p === 'All' ? 'All' : p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.filterLabel, { marginTop: 10 }]}>Format</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {ALL_FORMATS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, formatFilter === f && styles.filterChipActive]}
              onPress={() => setFormatFilter(f)}
            >
              <Text style={[styles.filterChipText, formatFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultCount}>{filtered.length} ideas</Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={40} color="#333" />
            <Text style={styles.emptyTitle}>No ideas match</Text>
            <Text style={styles.emptySubtitle}>Adjust your filters or capture a new idea</Text>
          </View>
        ) : (
          filtered.map(idea => (
            <View key={idea.id} style={styles.ideaCard}>
              <View style={styles.ideaHeader}>
                <View style={styles.platformChip}>
                  <PlatformIcon platform={idea.platform} size={12} />
                  <Text style={styles.platformText}>{idea.platform}</Text>
                </View>
                <View style={styles.formatChip}>
                  <Text style={styles.formatText}>{idea.format}</Text>
                </View>
              </View>
              <Text style={styles.ideaTitle}>{idea.title}</Text>
              {idea.campaign && (
                <View style={styles.campaignTag}>
                  <Ionicons name="flag-outline" size={11} color="#666" />
                  <Text style={styles.campaignText}>{idea.campaign}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: { color: '#666', fontSize: 10, letterSpacing: 2, textAlign: 'center' },
  brandName: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  filtersWrap: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  filterLabel: { color: '#555', fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  filterRow: { flexGrow: 0 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterChipText: { color: '#888', fontSize: 12, textTransform: 'capitalize' },
  filterChipTextActive: { color: '#000', fontWeight: '600' },
  scroll: { flex: 1 },
  resultCount: { color: '#555', fontSize: 12, marginBottom: 12 },
  ideaCard: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  ideaHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformText: { color: '#888', fontSize: 11, textTransform: 'capitalize' },
  formatChip: {
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  formatText: { color: '#888', fontSize: 11 },
  ideaTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  campaignTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  campaignText: { color: '#555', fontSize: 11 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { color: '#555', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: '#333', fontSize: 13, textAlign: 'center' },
});
