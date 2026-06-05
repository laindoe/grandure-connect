import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlatformBadge } from '../components/PlatformIcon';
import { BRANDS } from '../data/mockData';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="menu" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logoWrap}>
          <Text style={styles.logoTop}>GRANDURE</Text>
          <Text style={styles.logoBottom}>connect</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="person-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>PROFILES</Text>

        {BRANDS.map(brand => (
          <TouchableOpacity
            key={brand.id}
            style={styles.card}
            onPress={() => navigation.navigate('BrandWorkspace', { brandId: brand.id })}
            activeOpacity={0.9}
          >
            {/* Banner */}
            <LinearGradient colors={brand.bannerColor} style={styles.banner}>
              <Text style={styles.brandName}>{brand.name}</Text>
              {brand.tagline ? <Text style={styles.tagline}>{brand.tagline}</Text> : null}
            </LinearGradient>

            {/* Stats + Phase */}
            <View style={styles.cardBottom}>
              <View style={styles.statsRow}>
                {brand.stats.map((s, i) => (
                  <React.Fragment key={s.platform}>
                    <PlatformBadge platform={s.platform} count={s.count} />
                    {i < brand.stats.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.phaseDivider} />

              <View style={styles.phaseSection}>
                <View>
                  <Text style={styles.phaseLabel}>CURRENT PHASE</Text>
                  <Text style={styles.phaseName}>{brand.currentPhase.name}</Text>
                  <Text style={styles.phaseNext}>Next: {brand.currentPhase.next}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Add New Profile */}
        <TouchableOpacity style={styles.addCard} activeOpacity={0.8}>
          <View style={styles.addIcon}>
            <Ionicons name="add" size={26} color="#fff" />
          </View>
          <View style={styles.addText}>
            <Text style={styles.addTitle}>Add New Profile</Text>
            <Text style={styles.addSubtitle}>Start tracking a new brand or project.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>
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
    paddingBottom: 16,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center' },
  logoTop: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 6,
    fontFamily: 'System',
  },
  logoBottom: {
    color: '#fff',
    fontSize: 12,
    letterSpacing: 8,
    marginTop: -2,
  },
  scroll: { flex: 1, paddingHorizontal: 16 },
  sectionLabel: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 14,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#111',
  },
  banner: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  brandName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
  cardBottom: {
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#333',
  },
  phaseDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  phaseSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phaseLabel: {
    color: '#666',
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  phaseName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  phaseNext: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { flex: 1 },
  addTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  addSubtitle: { color: '#666', fontSize: 12, marginTop: 2 },
});
