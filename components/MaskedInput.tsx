import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

const ORANGE = '#E8603C';

interface Props extends Omit<TextInputProps, 'onChangeText'> {
  label?: string;
  value: string;
  onChangeText: (masked: string, raw: string) => void;
  mask?: (value: string) => string;
  error?: string;
  style?: ViewStyle;
}

export function MaskedInput({ label, value, onChangeText, mask, error, style, secureTextEntry, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;

  function handleChange(text: string) {
    const masked = mask ? mask(text) : text;
    const raw = masked.replace(/\D/g, '');
    onChangeText(masked, raw);
  }

  return (
    <View style={[styles.wrapper, style as ViewStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholderTextColor="#999"
          secureTextEntry={isPassword && !visible}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setVisible((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 4,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputRowError: {
    borderColor: '#ff4444',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 11,
    color: '#ffdddd',
    marginTop: 3,
  },
});
