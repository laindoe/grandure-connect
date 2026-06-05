import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDS } from '../data/mockData';

const TYPE_CONFIG = {
  image: { icon: 'image-outline', color: '#4A90D9', label: 'Image' },
  video: { icon: 'videocam-outline', color: '#FF6B6B', label: 'Video' },
  link: { icon: 'link-outline', color: '#7B68EE', label: 'Link' },
  note: { icon: 'document-text-outline', color: '#FF9800', label: 'Note' },
};

export default function InspirationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { brandId } = route.params;
  const brand = BRANDS.find(b => b.id === brandId);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>INSPIRATION GALLERY</Text>
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {brand.inspiration.map(item => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.note;
            return (
              <View key={item.id} style={styles.card}>
                <View style={[styles.typeIcon, { backgroundColor: config.color + '22' }]}>
                  <Ionicons name={config.icon} size={20} color={config.color} />
                </View>
                <Text style={styles.typeLabel}>{config.label}</Text>
                <Text style={styles.cardContent} numberOfLines={4}>{item.content}</Text>
              </View>
            );
          })}

          {/* Add card */}
          <TouchableOpacity style={styles.addCard}>
            <View style={styles.addIcon}>
              <Ionicons name="add" size={24} color="#555" />
            </View>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>
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
  addBtn: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    gap: 8,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: { color: '#555', fontSize: 10, letterSpacing: 1 },
  cardContent: { color: '#ccc', fontSize: 12, lineHeight: 18 },
  addCard: {
    width: '47%',
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 120,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#555', fontSize: 13 },
});
