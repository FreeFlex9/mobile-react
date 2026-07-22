import { useState } from 'react';
import {
  ActivityIndicator,
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
import { DocumentPickerField } from '@/components/DocumentPickerField';
import { useCEP } from '@/hooks/useCEP';
import { maskCEP, maskCNPJ, maskPhone, unmask } from '@/utils/masks';
import { validateCNPJ, validateEmail, validatePhone } from '@/utils/validators';
import { PickedFile, appendFileToFormData } from '@/utils/upload';
import { api, ApiError } from '@/services/api';
import { alert } from '@/utils/alert';

const TEAL = '#5BBCAD';
const ORANGE = '#E8603C';

type Step = 1 | 2 | 3;

interface FormData {
  nome_fantasia: string;
  email: string;
  cnpj: string;
  telefone: string;
  senha: string;
  senha_confirmation: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

const INITIAL: FormData = {
  nome_fantasia: '', email: '', cnpj: '', telefone: '', senha: '', senha_confirmation: '',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
};

export default function RegisterEmpresaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const [cartaoCnpj, setCartaoCnpj] = useState<PickedFile | null>(null);
  const [docError, setDocError] = useState<string | undefined>();

  const { lookup: lookupCEP, loading: cepLoading, error: cepError } = useCEP((address) => {
    setForm((prev) => ({ ...prev, ...address }));
  });

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep1(): boolean {
    const errs: Errors = {};
    if (!form.nome_fantasia.trim()) errs.nome_fantasia = 'Informe o nome fantasia.';
    if (!validateEmail(form.email)) errs.email = 'Informe um e-mail válido.';
    if (!validateCNPJ(form.cnpj)) errs.cnpj = 'CNPJ inválido.';
    if (form.telefone && !validatePhone(form.telefone)) errs.telefone = 'Telefone inválido.';
    if (form.senha.length < 8) errs.senha = 'Mínimo 8 caracteres.';
    if (form.senha !== form.senha_confirmation) errs.senha_confirmation = 'As senhas não coincidem.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Errors = {};
    if (unmask(form.cep).length !== 8) errs.cep = 'CEP inválido.';
    if (!form.endereco.trim()) errs.endereco = 'Informe o endereço.';
    if (!form.numero.trim()) errs.numero = 'Informe o número.';
    if (!form.bairro.trim()) errs.bairro = 'Informe o bairro.';
    if (!form.cidade.trim()) errs.cidade = 'Informe a cidade.';
    if (form.estado.length !== 2) errs.estado = 'UF inválida (2 letras).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    if (!cartaoCnpj) {
      setDocError('Envie a foto do Cartão CNPJ.');
      return false;
    }
    setDocError(undefined);
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('nome_fantasia', form.nome_fantasia);
      data.append('email', form.email);
      data.append('cnpj', unmask(form.cnpj));
      data.append('telefone', unmask(form.telefone));
      data.append('senha', form.senha);
      data.append('senha_confirmation', form.senha_confirmation);
      data.append('cep', unmask(form.cep));
      data.append('endereco', form.endereco);
      data.append('numero', form.numero);
      data.append('complemento', form.complemento);
      data.append('bairro', form.bairro);
      data.append('cidade', form.cidade);
      data.append('estado', form.estado);
      if (cartaoCnpj) await appendFileToFormData(data, 'cartao_cnpj', cartaoCnpj);
      await api.registerEmpresa(data);
      alert(
        'Cadastro enviado!',
        'Sua empresa foi cadastrada e está aguardando aprovação. Você será notificado por e-mail.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err) {
      const e = err as ApiError;
      const detail = e.errors ? Object.values(e.errors).flat().join('\n') : e.message;
      alert('Erro no cadastro', detail);
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) handleSubmit();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep((s) => (s - 1) as Step) : router.back())}>
          <Text style={styles.backArrow}>↩</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {/* Título e indicador de etapas */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Sou Empresa</Text>
          <View style={styles.stepRow}>
            {([1, 2, 3] as Step[]).map((s) => (
              <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
            ))}
          </View>
        </View>

        {/* Campos com scroll */}
        <ScrollView
          contentContainerStyle={styles.fields}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <>
              <MaskedInput placeholder="Nome fantasia" value={form.nome_fantasia} onChangeText={(v) => set('nome_fantasia', v)} error={errors.nome_fantasia} autoCapitalize="words" />
              <MaskedInput placeholder="E-mail" value={form.email} onChangeText={(v) => set('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
              <MaskedInput placeholder="CNPJ" value={form.cnpj} onChangeText={(masked) => set('cnpj', masked)} mask={maskCNPJ} error={errors.cnpj} keyboardType="numeric" />
              <MaskedInput placeholder="Telefone (opcional)" value={form.telefone} onChangeText={(masked) => set('telefone', masked)} mask={maskPhone} error={errors.telefone} keyboardType="phone-pad" />
              <MaskedInput placeholder="Senha (mín. 8 caracteres)" value={form.senha} onChangeText={(v) => set('senha', v)} error={errors.senha} secureTextEntry />
              <MaskedInput placeholder="Confirmar senha" value={form.senha_confirmation} onChangeText={(v) => set('senha_confirmation', v)} error={errors.senha_confirmation} secureTextEntry />
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.cepRow}>
                <MaskedInput
                  placeholder="CEP"
                  value={form.cep}
                  onChangeText={(masked) => { set('cep', masked); lookupCEP(masked); }}
                  mask={maskCEP}
                  error={errors.cep ?? cepError ?? undefined}
                  keyboardType="numeric"
                  style={styles.cepInput}
                />
                {cepLoading && <ActivityIndicator color="#fff" style={styles.cepSpinner} />}
              </View>
              <MaskedInput placeholder="Endereço" value={form.endereco} onChangeText={(v) => set('endereco', v)} error={errors.endereco} />
              <MaskedInput placeholder="Número" value={form.numero} onChangeText={(v) => set('numero', v)} error={errors.numero} keyboardType="numeric" />
              <MaskedInput placeholder="Complemento (opcional)" value={form.complemento} onChangeText={(v) => set('complemento', v)} />
              <MaskedInput placeholder="Bairro" value={form.bairro} onChangeText={(v) => set('bairro', v)} error={errors.bairro} />
              <MaskedInput placeholder="Cidade" value={form.cidade} onChangeText={(v) => set('cidade', v)} error={errors.cidade} />
              <MaskedInput placeholder="Estado (UF)" value={form.estado} onChangeText={(v) => set('estado', v.toUpperCase().slice(0, 2))} error={errors.estado} autoCapitalize="characters" maxLength={2} />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.infoText}>
                Envie uma foto do Cartão CNPJ para validarmos sua empresa.
              </Text>
              <View style={styles.docRow}>
                <DocumentPickerField label="Foto do Cartão CNPJ" value={cartaoCnpj} onChange={setCartaoCnpj} error={docError} />
              </View>
            </>
          )}
        </ScrollView>

        {/* Botão fixo no rodapé */}
        <View style={[styles.footer, { paddingBottom: 36 + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.btnOrange, loading && styles.btnDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnOrangeText}>{step === 3 ? 'Registrar' : 'Próximo'}</Text>
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
  fields: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cepInput: { flex: 1 },
  cepSpinner: { marginLeft: 10, marginTop: 14 },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
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
  infoText: { color: '#fff', fontSize: 14, lineHeight: 22, marginBottom: 16, textAlign: 'center' },
  docRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
});
