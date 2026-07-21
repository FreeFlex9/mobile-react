import { StyleSheet, Text, View } from 'react-native';

interface Props {
  status: string;
}

const CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: {
    bg: '#FFF3CD',
    text: '#8A6D3B',
    label: 'Seu cadastro está em análise. Você será notificado quando for aprovado.',
  },
  rejected: {
    bg: '#F8D7DA',
    text: '#842029',
    label: 'Seu cadastro foi rejeitado. Entre em contato com o suporte para mais informações.',
  },
};

export function StatusBanner({ status }: Props) {
  const config = CONFIG[status];
  if (!config) return null;

  return (
    <View style={[styles.banner, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  text: { fontSize: 13, lineHeight: 18 },
});
