import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PHASES = [
  { key: 'Awareness', color: '#4A90D9', icon: 'megaphone-outline' },
  { key: 'Engagement', color: '#7B68EE', icon: 'people-outline' },
  { key: 'Conversion', color: '#FF6B6B', icon: 'trending-up-outline' },
];

export default function TimelineView({ brand }) {
  const campaigns = brand.campaigns;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Campaign Timeline</Text>
      <Text style={styles.subtitle}>{brand.season.name}</Text>

      {PHASES.map((phase, phaseIdx) => {
        const phaseCampaigns = campaigns.filter(c => c.phase === phase.key);

        return (
          <View key={phase.key} style={styles.phaseBlock}>
            <View style={styles.phaseHeader}>
              <View style={[styles.phaseIconWrap, { backgroundColor: phase.color + '22' }]}>
                <Ionicons name={phase.icon} size={16} color={phase.color} />
              </View>
              <Text style={[styles.phaseTitle, { color: phase.color }]}>{phase.key}</Text>
              {phaseIdx < PHASES.length - 1 && (
                <View style={styles.connector}>
                  <Ionicons name="arrow-down" size={14} color="#333" />
                </View>
              )}
            </View>

            {phaseCampaigns.length === 0 ? (
              <View style={styles.emptyCampaign}>
                <Text style={styles.emptyText}>No campaigns in this phase</Text>
              </View>
            ) : (
              phaseCampaigns.map(c => (
                <View key={c.id} style={[styles.campaignCard, c.status === 'active' && styles.campaignActive]}>
                  {c.status === 'active' && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                  <Text style={styles.campaignName}>{c.name}</Text>
                  <Text style={styles.campaignDates}>{c.startDate} → {c.endDate}</Text>
                  <StatusBadge status={c.status} />
                </View>
              ))
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function StatusBadge({ status }) {
  const config = {
    active: { color: '#4CAF50', label: 'Active' },
    upcoming: { color: '#FF9800', label: 'Upcoming' },
    planned: { color: '#9E9E9E', label: 'Planned' },
    completed: { color: '#2196F3', label: 'Completed' },
  };
  const { color, label } = config[status] || config.planned;
  return (
    <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#666', fontSize: 13, marginBottom: 24 },
  phaseBlock: { marginBottom: 12 },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  phaseIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, flex: 1 },
  connector: { alignItems: 'center' },
  campaignCard: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  campaignActive: {
    borderColor: '#fff',
    borderWidth: 1,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  activeBadgeText: { color: '#000', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  campaignName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  campaignDates: { color: '#666', fontSize: 12, marginBottom: 10 },
  emptyCampaign: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: { color: '#444', fontSize: 13 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
