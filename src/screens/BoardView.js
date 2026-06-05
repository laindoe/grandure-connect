import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlatformIcon from '../components/PlatformIcon';

const COLUMNS = [
  { key: 'ideas', label: 'Ideas', icon: 'bulb-outline', color: '#9E9E9E' },
  { key: 'drafting', label: 'Drafting', icon: 'create-outline', color: '#FF9800' },
  { key: 'ready', label: 'Ready', icon: 'checkmark-circle-outline', color: '#4CAF50' },
  { key: 'posted', label: 'Posted', icon: 'paper-plane-outline', color: '#4A90D9' },
];

export default function BoardView({ brand }) {
  const board = brand.board;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {COLUMNS.map(col => {
        const items = board[col.key] || [];
        return (
          <View key={col.key} style={styles.column}>
            <View style={styles.colHeader}>
              <View style={[styles.colIconWrap, { backgroundColor: col.color + '22' }]}>
                <Ionicons name={col.icon} size={14} color={col.color} />
              </View>
              <Text style={[styles.colTitle, { color: col.color }]}>{col.label}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{items.length}</Text>
              </View>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyCol}>
                <Text style={styles.emptyText}>Nothing here yet</Text>
              </View>
            ) : (
              items.map(item => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.platformChip}>
                      <PlatformIcon platform={item.platform} size={12} />
                      <Text style={styles.platformText}>{item.platform}</Text>
                    </View>
                    <View style={styles.formatChip}>
                      <Text style={styles.formatText}>{item.format}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  column: { marginBottom: 24 },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  colIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  countBadge: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { color: '#888', fontSize: 11, fontWeight: '600' },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 8 },
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
  emptyCol: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    alignItems: 'center',
  },
  emptyText: { color: '#333', fontSize: 13 },
});
