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
import { DocumentPickerField } from '@/components/DocumentPickerField';
import { useCEP } from '@/hooks/useCEP';
import { maskCEP, maskCPF, maskPhone, unmask } from '@/utils/masks';
import { validateCPF, validateEmail, validatePhone } from '@/utils/validators';
import { PickedFile, appendFileToFormData } from '@/utils/upload';
import { api, ApiError } from '@/services/api';

const TEAL = '#5BBCAD';
const ORANGE = '#E8603C';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  nome: string;
  email: string;
  cpf: string;
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
  nome: '', email: '', cpf: '', telefone: '', senha: '', senha_confirmation: '',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
};

export default function RegisterPrestadorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const [temCnh, setTemCnh] = useState<boolean | null>(null);
  const [cnhDigital, setCnhDigital] = useState(false);
  const [rgFrente, setRgFrente] = useState<PickedFile | null>(null);
  const [rgVerso, setRgVerso] = useState<PickedFile | null>(null);
  const [cnhFrente, setCnhFrente] = useState<PickedFile | null>(null);
  const [cnhVerso, setCnhVerso] = useState<PickedFile | null>(null);
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});

  const { lookup: lookupCEP, loading: cepLoading, error: cepError } = useCEP((address) => {
    setForm((prev) => ({ ...prev, ...address }));
  });

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep1(): boolean {
    const errs: Errors = {};
    if (!form.nome.trim()) errs.nome = 'Informe seu nome completo.';
    if (!validateEmail(form.email)) errs.email = 'Informe um e-mail válido.';
    if (!validateCPF(form.cpf)) errs.cpf = 'CPF inválido.';
    if (!validatePhone(form.telefone)) errs.telefone = 'Telefone inválido.';
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
    const errs: Record<string, string> = {};
    if (temCnh === null) errs.temCnh = 'Informe se você possui CNH.';
    if (temCnh === false) {
      if (!rgFrente) errs.rgFrente = 'Envie a foto da frente do RG.';
      if (!rgVerso) errs.rgVerso = 'Envie a foto do verso do RG.';
    } else if (temCnh === true) {
      if (!cnhFrente) errs.cnhFrente = 'Envie a foto da CNH.';
      if (!cnhDigital && !cnhVerso) errs.cnhVerso = 'Envie a foto do verso da CNH.';
    }
    setDocErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('nome', form.nome);
      data.append('email', form.email);
      data.append('cpf', unmask(form.cpf));
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
      data.append('tem_cnh', temCnh ? '1' : '0');
      data.append('cnh_digital', cnhDigital ? '1' : '0');

      if (temCnh) {
        if (cnhFrente) await appendFileToFormData(data, 'cnh_frente', cnhFrente);
        if (!cnhDigital && cnhVerso) await appendFileToFormData(data, 'cnh_verso', cnhVerso);
      } else {
        if (rgFrente) await appendFileToFormData(data, 'rg_frente', rgFrente);
        if (rgVerso) await appendFileToFormData(data, 'rg_verso', rgVerso);
      }

      await api.registerPrestador(data);
      Alert.alert(
        'Cadastro enviado!',
        'Seu cadastro foi recebido e está em análise. Você será notificado por e-mail após a aprovação.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err) {
      const e = err as ApiError;
      const detail = e.errors ? Object.values(e.errors).flat().join('\n') : e.message;
      Alert.alert('Erro no cadastro', detail);
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
    else if (step === 4) handleSubmit();
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
          <Text style={styles.cardTitle}>Sou Prestador</Text>
          <View style={styles.stepRow}>
            {([1, 2, 3, 4] as Step[]).map((s) => (
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
              <MaskedInput placeholder="Nome completo" value={form.nome} onChangeText={(v) => set('nome', v)} error={errors.nome} autoCapitalize="words" />
              <MaskedInput placeholder="E-mail" value={form.email} onChangeText={(v) => set('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
              <MaskedInput placeholder="CPF" value={form.cpf} onChangeText={(masked) => set('cpf', masked)} mask={maskCPF} error={errors.cpf} keyboardType="numeric" />
              <MaskedInput placeholder="Celular — (XX) XXXXX-XXXX" value={form.telefone} onChangeText={(masked) => set('telefone', masked)} mask={maskPhone} error={errors.telefone} keyboardType="phone-pad" />
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
              <Text style={styles.infoText}>Você possui CNH?</Text>
              <View style={styles.choiceRow}>
                <TouchableOpacity
                  style={[styles.choiceBtn, temCnh === true && styles.choiceBtnActive]}
                  onPress={() => setTemCnh(true)}
                >
                  <Text style={[styles.choiceBtnText, temCnh === true && styles.choiceBtnTextActive]}>Sim</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choiceBtn, temCnh === false && styles.choiceBtnActive]}
                  onPress={() => setTemCnh(false)}
                >
                  <Text style={[styles.choiceBtnText, temCnh === false && styles.choiceBtnTextActive]}>Não</Text>
                </TouchableOpacity>
              </View>
              {docErrors.temCnh && <Text style={styles.errorTextDoc}>{docErrors.temCnh}</Text>}

              {temCnh === true && (
                <>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setCnhDigital((v) => !v)}
                  >
                    <View style={[styles.checkbox, cnhDigital && styles.checkboxChecked]} />
                    <Text style={styles.checkboxLabel}>Minha CNH é digital (formato PDF, sem verso)</Text>
                  </TouchableOpacity>
                  <View style={styles.docRow}>
                    <DocumentPickerField label="Foto da CNH (frente)" value={cnhFrente} onChange={setCnhFrente} error={docErrors.cnhFrente} />
                    {!cnhDigital && (
                      <DocumentPickerField label="Foto da CNH (verso)" value={cnhVerso} onChange={setCnhVerso} error={docErrors.cnhVerso} />
                    )}
                  </View>
                </>
              )}

              {temCnh === false && (
                <View style={styles.docRow}>
                  <DocumentPickerField label="Foto do RG (frente)" value={rgFrente} onChange={setRgFrente} error={docErrors.rgFrente} />
                  <DocumentPickerField label="Foto do RG (verso)" value={rgVerso} onChange={setRgVerso} error={docErrors.rgVerso} />
                </View>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.infoText}>
                Confira seus dados antes de enviar. Após o cadastro, nossa equipe irá analisar seus documentos.
              </Text>
              <Text style={styles.infoText}>
                Você será notificado por e-mail quando sua conta for aprovada.
              </Text>
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
              : <Text style={styles.btnOrangeText}>{step === 4 ? 'Registrar' : 'Próximo'}</Text>
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
  choiceRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  choiceBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: 'center',
  },
  choiceBtnActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  choiceBtnText: { color: '#fff', fontWeight: '700' },
  choiceBtnTextActive: { color: '#fff' },
  errorTextDoc: { color: '#ffdddd', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 14 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: ORANGE, borderColor: ORANGE },
  checkboxLabel: { color: '#fff', fontSize: 13, flex: 1 },
  docRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
});
