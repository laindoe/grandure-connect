import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlatformIcon from '../components/PlatformIcon';
import { BRANDS } from '../data/mockData';

const ALL_PLATFORMS = ['instagram', 'threads', 'youtube', 'newsletter', 'blog'];
const PLATFORM_LABELS = {
  instagram: 'Instagram',
  threads: 'Threads',
  youtube: 'YouTube',
  newsletter: 'Newsletter',
  blog: 'Blog',
};

export default function PlatformStrategyScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { brandId } = route.params;
  const brand = BRANDS.find(b => b.id === brandId);
  const availablePlatforms = brand.stats.map(s => s.platform);
  const [activePlatform, setActivePlatform] = useState(availablePlatforms[0]);
  const strategy = brand.platformStrategy[activePlatform];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>PLATFORM STRATEGY</Text>
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Platform Switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.platformBar}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {availablePlatforms.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.platformTab, activePlatform === p && styles.platformTabActive]}
            onPress={() => setActivePlatform(p)}
          >
            <PlatformIcon platform={p} size={16} color={activePlatform === p ? '#000' : '#888'} />
            <Text style={[styles.platformTabText, activePlatform === p && styles.platformTabTextActive]}>
              {PLATFORM_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {strategy ? (
          <>
            <StrategySection icon="flag-outline" title="Objective">
              <Text style={styles.bodyText}>{strategy.objective}</Text>
            </StrategySection>

            <StrategySection icon="layers-outline" title="Themes">
              {strategy.themes.map((t, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bodyText}>{t}</Text>
                </View>
              ))}
            </StrategySection>

            <StrategySection icon="videocam-outline" title="Formats">
              <View style={styles.tagWrap}>
                {strategy.formats.map(f => (
                  <View key={f} style={styles.formatTag}>
                    <Text style={styles.formatTagText}>{f}</Text>
                  </View>
                ))}
              </View>
            </StrategySection>

            <StrategySection icon="trophy-outline" title="Goals">
              {strategy.goals.map((g, i) => (
                <View key={i} style={styles.goalRow}>
                  <View style={styles.goalCheck}>
                    <Ionicons name="checkmark" size={12} color="#000" />
                  </View>
                  <Text style={styles.bodyText}>{g}</Text>
                </View>
              ))}
            </StrategySection>
          </>
        ) : (
          <View style={styles.emptyState}>
            <PlatformIcon platform={activePlatform} size={40} color="#333" />
            <Text style={styles.emptyTitle}>No strategy yet</Text>
            <Text style={styles.emptySubtitle}>Tap to define your {PLATFORM_LABELS[activePlatform]} strategy</Text>
            <TouchableOpacity style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Add Strategy</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StrategySection({ icon, title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={15} color="#888" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
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
    paddingBottom: 12,
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
  platformBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  platformTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  platformTabActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  platformTabText: { color: '#888', fontSize: 13 },
  platformTabTextActive: { color: '#000', fontWeight: '600' },
  scroll: { flex: 1 },
  section: {
    backgroundColor: '#111',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  sectionTitle: { color: '#888', fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
  sectionBody: { padding: 16 },
  bodyText: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff', marginTop: 8 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formatTag: {
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  formatTagText: { color: '#aaa', fontSize: 12 },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  goalCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { color: '#555', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: '#333', fontSize: 13, textAlign: 'center' },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
