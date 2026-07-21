import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { PickedFile } from '@/utils/upload';

const ORANGE = '#E8603C';

interface Props {
  label: string;
  value: PickedFile | null;
  onChange: (file: PickedFile) => void;
  error?: string;
}

export function DocumentPickerField({ label, value, onChange, error }: Props) {
  const [loading, setLoading] = useState(false);

  async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onChange({
          uri: asset.uri,
          name: asset.fileName ?? `documento-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? 'image/jpeg',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={[styles.box, error ? styles.boxError : null]} onPress={pick} disabled={loading}>
        {value ? (
          <Image source={{ uri: value.uri }} style={styles.thumb} />
        ) : (
          <Ionicons name="camera-outline" size={26} color={ORANGE} />
        )}
        <Text style={styles.label} numberOfLines={2}>
          {value ? 'Trocar foto' : label}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, minWidth: '45%', marginBottom: 14 },
  box: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  boxError: { borderColor: '#ff4444' },
  thumb: { width: 52, height: 52, borderRadius: 6, marginBottom: 6 },
  label: { fontSize: 11, color: '#555', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  errorText: { fontSize: 11, color: '#ff4444', marginTop: 3, textAlign: 'center' },
});
