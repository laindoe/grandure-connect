import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDS } from '../data/mockData';

export default function IdeaCaptureBar() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);

  const platforms = ['instagram', 'threads', 'youtube', 'newsletter', 'blog'];
  const formats = ['Reel', 'Carousel', 'Thread', 'Long-form', 'Short', 'Story', 'Email', 'Post'];

  function handleSave() {
    setText('');
    setSelectedBrand(null);
    setSelectedPlatform(null);
    setSelectedFormat(null);
    setExpanded(false);
  }

  return (
    <>
      <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.micBtn} onPress={() => {}}>
          <Ionicons name="mic-outline" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputWrapper} onPress={() => setExpanded(true)} activeOpacity={0.8}>
          <Text style={[styles.inputText, !text && styles.placeholder]}>
            {text || 'Capture an idea...'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imgBtn} onPress={() => {}}>
          <Ionicons name="image-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      <Modal visible={expanded} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Idea</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="What's the idea?"
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />

            <Text style={styles.sectionLabel}>BRAND</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {BRANDS.map(b => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.chip, selectedBrand === b.id && styles.chipActive]}
                  onPress={() => setSelectedBrand(b.id)}
                >
                  <Text style={[styles.chipText, selectedBrand === b.id && styles.chipTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>PLATFORM</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {platforms.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, selectedPlatform === p && styles.chipActive]}
                  onPress={() => setSelectedPlatform(p)}
                >
                  <Text style={[styles.chipText, selectedPlatform === p && styles.chipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>FORMAT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {formats.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, selectedFormat === f && styles.chipActive]}
                  onPress={() => setSelectedFormat(f)}
                >
                  <Text style={[styles.chipText, selectedFormat === f && styles.chipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setExpanded(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save to Vault</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  micBtn: { padding: 8 },
  imgBtn: { padding: 8 },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputText: { color: '#fff', fontSize: 14 },
  placeholder: { color: '#555' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalSheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  chipRow: { marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  chipText: { color: '#888', fontSize: 13, textTransform: 'capitalize' },
  chipTextActive: { color: '#000', fontWeight: '600' },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  cancelText: { color: '#888', fontSize: 15 },
  saveBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  saveText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
