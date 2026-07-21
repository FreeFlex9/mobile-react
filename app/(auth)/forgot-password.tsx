import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaskedInput } from '@/components/MaskedInput';
import { validateEmail } from '@/utils/validators';
import { BASE_URL } from '@/services/api';

const TEAL = '#5BBCAD';
const ORANGE = '#E8603C';

type Step = 'email' | 'code';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaConfirmation, setSenhaConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!validateEmail(email)) {
      Alert.alert('Atenção', 'Informe um e-mail válido.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      const msg = json.debug_code
        ? `${json.message}\n\n[DEV] Código: ${json.debug_code}`
        : json.message;
      if (json.debug_code) setCode(json.debug_code);
      Alert.alert('Código enviado', msg, [
        { text: 'OK', onPress: () => setStep('code') },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (code.length !== 6) {
      Alert.alert('Atenção', 'O código deve ter 6 dígitos.');
      return;
    }
    if (senha.length < 8) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== senhaConfirmation) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, code, senha, senha_confirmation: senhaConfirmation }),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Erro', json.message ?? 'Código inválido ou expirado.');
        return;
      }
      Alert.alert('Sucesso!', json.message, [
        { text: 'Fazer login', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 'code' ? setStep('email') : router.back())}>
          <Text style={styles.backArrow}>↩</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Esqueci minha senha</Text>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 'code' && styles.stepDotActive]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.fields}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'email' && (
            <>
              <Text style={styles.description}>
                Informe o e-mail cadastrado. Enviaremos um código de 6 dígitos para redefinir sua senha.
              </Text>
              <MaskedInput
                placeholder="E-mail cadastrado"
                value={email}
                onChangeText={(v) => setEmail(v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          )}

          {step === 'code' && (
            <>
              <Text style={styles.description}>
                Digite o código de 6 dígitos enviado para{' '}
                <Text style={styles.emailHighlight}>{email}</Text> e escolha uma nova senha.
              </Text>
              <MaskedInput
                placeholder="Código (6 dígitos)"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
              />
              <MaskedInput
                placeholder="Nova senha (mín. 8 caracteres)"
                value={senha}
                onChangeText={(v) => setSenha(v)}
                secureTextEntry
              />
              <MaskedInput
                placeholder="Confirmar nova senha"
                value={senhaConfirmation}
                onChangeText={(v) => setSenhaConfirmation(v)}
                secureTextEntry
              />
              <TouchableOpacity onPress={() => { setCode(''); setStep('email'); }}>
                <Text style={styles.resendLink}>Não recebi o código — reenviar</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: 36 + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.btnOrange, loading && styles.btnDisabled]}
            onPress={step === 'email' ? handleSendCode : handleReset}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnOrangeText}>
                  {step === 'email' ? 'Enviar código' : 'Redefinir senha'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backArrow: { fontSize: 24, color: '#444' },
  card: {
    flex: 1,
    backgroundColor: TEAL,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  cardHeader: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.4)' },
  stepDotActive: { backgroundColor: '#fff' },
  fields: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  emailHighlight: {
    fontWeight: '700',
  },
  resendLink: {
    color: '#fff',
    fontSize: 13,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  btnOrange: {
    backgroundColor: ORANGE,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnOrangeText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
