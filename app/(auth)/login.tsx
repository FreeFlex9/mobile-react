import { useState } from 'react';
import { ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaskedInput } from '@/components/MaskedInput';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';

const TEAL = '#84d3c7';
const ORANGE = '#E8603C';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [loginInput, setLoginInput] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!loginInput.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail/CPF/CNPJ e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(loginInput.trim(), senha);
      router.replace('/(tabs)');
    } catch (err) {
      const e = err as ApiError;
      Alert.alert('Erro ao entrar', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo acima do card */}
      <View style={styles.logoArea}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Card teal ocupa o resto da tela */}
      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Seja Bem-vindo ao FreeFlex</Text>
          <Text style={styles.subtitle}>Conectando empresas e prestadores</Text>

          {/* Formulário */}
          <View style={styles.formCard}>
            <MaskedInput
              placeholder="E-mail, CPF ou CNPJ"
              value={loginInput}
              onChangeText={(v) => setLoginInput(v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <MaskedInput
              placeholder="Senha"
              value={senha}
              onChangeText={(v) => setSenha(v)}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.btnEntrar, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnEntrarText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <Pressable style={{ alignSelf: 'center', marginTop: 12 }} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.linkText}>Esqueceu a senha?</Text>
          </Pressable>

          
        </ScrollView>

        {/* Rodapé fixo no fundo do card */}
        <View style={[styles.footer, { paddingBottom: 5 + insets.bottom }]}>
          
          <Text style={styles.registerLabel}>Não tem conta? Registre-se!</Text>
          <View style={styles.registerRow}>
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={() => router.push('/(auth)/register-prestador')}
            >
              <Text style={styles.btnOutlineText}>SOU PRESTADOR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnOutline, styles.btnOutlineFilled]}
              onPress={() => router.push('/(auth)/register-empresa')}
            >
              <Text style={[styles.btnOutlineText, styles.btnOutlineFilledText]}>SOU EMPRESA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoArea: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 8,
  },
  logo: {
    width: 140,
    height: 100,
  },
  card: {
    flex: 1,
    backgroundColor: TEAL,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  btnEntrar: {
    backgroundColor: ORANGE,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnEntrarText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  spacer: { flex: 1, minHeight: 16 },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  linkText: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 6,
  },
  registerLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  registerRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnOutline: {
    flex: 1,
    borderWidth: 2,
    borderColor: ORANGE,
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  btnOutlineText: {
    color: ORANGE,
    fontWeight: '700',
    fontSize: 13,
  },
  btnOutlineFilled: {
    backgroundColor: ORANGE,
  },
  btnOutlineFilledText: {
    color: '#fff',
  },
});
