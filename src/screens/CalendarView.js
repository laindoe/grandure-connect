import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlatformIcon from '../components/PlatformIcon';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SAMPLE_CALENDAR = {
  Mon: [
    { title: 'Energy playground intro reel', platform: 'instagram', format: 'Reel', time: '9:00 AM' },
  ],
  Tue: [],
  Wed: [
    { title: 'Morning regulation routine', platform: 'youtube', format: 'Long-form', time: '12:00 PM' },
  ],
  Thu: [
    { title: 'Nervous system 101 thread', platform: 'threads', format: 'Thread', time: '2:00 PM' },
  ],
  Fri: [
    { title: 'Welcome to the playground', platform: 'instagram', format: 'Carousel', time: '10:00 AM' },
    { title: 'Community Q&A', platform: 'threads', format: 'Thread', time: '3:00 PM' },
  ],
  Sat: [],
  Sun: [],
};

export default function CalendarView({ brand }) {
  const [selectedDay, setSelectedDay] = useState('Mon');
  const dayContent = SAMPLE_CALENDAR[selectedDay] || [];

  return (
    <View style={styles.container}>
      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {DAYS.map(day => {
          const count = (SAMPLE_CALENDAR[day] || []).length;
          const isSelected = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{day}</Text>
              {count > 0 && (
                <View style={[styles.dayDot, isSelected && styles.dayDotActive]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content for selected day */}
      <ScrollView style={styles.dayContent} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.dayHeading}>{selectedDay}urday</Text>

        {dayContent.length === 0 ? (
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-clear-outline" size={32} color="#333" />
            <Text style={styles.emptyTitle}>Nothing scheduled</Text>
            <Text style={styles.emptySubtitle}>Tap + to add content to this day</Text>
          </View>
        ) : (
          dayContent.map((item, idx) => (
            <View key={idx} style={styles.contentCard}>
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{item.time}</Text>
                {idx < dayContent.length - 1 && <View style={styles.timeLine} />}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardMeta}>
                  <PlatformIcon platform={item.platform} size={14} color="#888" />
                  <Text style={styles.formatLabel}>{item.format}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.addSlot}>
          <Ionicons name="add-circle-outline" size={18} color="#555" />
          <Text style={styles.addSlotText}>Add content</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  daySelector: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    flexGrow: 0,
  },
  dayBtn: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 4,
    gap: 4,
  },
  dayBtnActive: { backgroundColor: '#fff' },
  dayText: { color: '#555', fontSize: 13, fontWeight: '600' },
  dayTextActive: { color: '#000' },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#555' },
  dayDotActive: { backgroundColor: '#000' },
  dayContent: { flex: 1 },
  dayHeading: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  contentCard: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  timeCol: { alignItems: 'center', width: 60 },
  timeText: { color: '#666', fontSize: 11, fontWeight: '500' },
  timeLine: { flex: 1, width: 1, backgroundColor: '#222', marginTop: 8 },
  cardBody: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  formatLabel: { color: '#666', fontSize: 11 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: { color: '#555', fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: '#333', fontSize: 13 },
  addSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    justifyContent: 'center',
    marginTop: 8,
  },
  addSlotText: { color: '#555', fontSize: 14 },
});
