import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDS } from '../data/mockData';

export default function OverviewScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { brandId } = route.params;
  const brand = BRANDS.find(b => b.id === brandId);
  const o = brand.overview;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>OVERVIEW</Text>
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <PlaybookSection icon="flag-outline" title="Mission">
          <Text style={styles.bodyText}>{o.mission}</Text>
        </PlaybookSection>

        <PlaybookSection icon="people-outline" title="Audience">
          <Text style={styles.bodyText}>{o.audience}</Text>
        </PlaybookSection>

        <PlaybookSection icon="podium-outline" title="Positioning">
          <Text style={styles.bodyText}>{o.positioning}</Text>
        </PlaybookSection>

        <PlaybookSection icon="mic-outline" title="Brand Voice">
          <Text style={styles.bodyText}>{o.brandVoice}</Text>
        </PlaybookSection>

        <PlaybookSection icon="pricetag-outline" title="Keywords">
          <View style={styles.tagWrap}>
            {o.keywords.map(k => (
              <View key={k} style={styles.tag}>
                <Text style={styles.tagText}>{k}</Text>
              </View>
            ))}
          </View>
        </PlaybookSection>

        <PlaybookSection icon="grid-outline" title="Content Pillars">
          {o.contentPillars.map((p, i) => (
            <View key={p} style={styles.pillarRow}>
              <View style={styles.pillarNum}>
                <Text style={styles.pillarNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.pillarText}>{p}</Text>
            </View>
          ))}
        </PlaybookSection>

        <PlaybookSection icon="bag-outline" title="Offers">
          {o.offers.map(offer => (
            <View key={offer} style={styles.offerRow}>
              <Ionicons name="arrow-forward-circle" size={14} color="#fff" />
              <Text style={styles.bodyText}>{offer}</Text>
            </View>
          ))}
        </PlaybookSection>

        <TouchableOpacity
          style={styles.platformBtn}
          onPress={() => navigation.navigate('PlatformStrategy', { brandId })}
        >
          <View>
            <Text style={styles.platformBtnLabel}>PLATFORM STRATEGY</Text>
            <Text style={styles.platformBtnSub}>View platform-specific plans →</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function PlaybookSection({ icon, title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={16} color="#888" />
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
    paddingBottom: 16,
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
  scroll: { flex: 1 },
  section: {
    marginBottom: 24,
    backgroundColor: '#111',
    borderRadius: 16,
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
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagText: { color: '#888', fontSize: 12 },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  pillarNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarNumText: { color: '#000', fontSize: 11, fontWeight: '800' },
  pillarText: { color: '#ccc', fontSize: 14 },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  platformBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fff',
  },
  platformBtnLabel: { color: '#666', fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  platformBtnSub: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
