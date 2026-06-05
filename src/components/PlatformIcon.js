import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const PLATFORM_CONFIG = {
  instagram: { icon: 'logo-instagram', lib: 'Ionicons', color: '#fff' },
  threads: { icon: 'at', lib: 'Ionicons', color: '#fff' },
  youtube: { icon: 'logo-youtube', lib: 'Ionicons', color: '#fff' },
  newsletter: { icon: 'mail-outline', lib: 'Ionicons', color: '#fff' },
  blog: { icon: 'newspaper-outline', lib: 'Ionicons', color: '#fff' },
};

export default function PlatformIcon({ platform, size = 22, color = '#fff' }) {
  const config = PLATFORM_CONFIG[platform] || { icon: 'ellipse-outline', lib: 'Ionicons' };
  return <Ionicons name={config.icon} size={size} color={color} />;
}

export function PlatformBadge({ platform, count }) {
  return (
    <View style={styles.badge}>
      <PlatformIcon platform={platform} size={20} />
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    gap: 4,
  },
  count: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
