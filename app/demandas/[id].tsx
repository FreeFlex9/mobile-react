import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { api, ApiError, DemandaDetalheResponse } from '@/services/api';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import { alert } from '@/utils/alert';

const TEAL = '#5BBCAD';
const ORANGE = '#E8603C';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando empresa',
  pending_admin_approval: 'Em aprovação',
  accepted: 'Aceita',
  rejected: 'Recusada',
};

export default function DemandaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<DemandaDetalheResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [mensagem, setMensagem] = useState('');
  const [teveCirurgia, setTeveCirurgia] = useState<boolean | null>(null);
  const [descricaoCirurgia, setDescricaoCirurgia] = useState('');
  const [consentimento, setConsentimento] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.demandaPrestador(Number(id));
      setData(res);
    } catch (err) {
      const e = err as ApiError;
      alert('Erro', e.message ?? 'Não foi possível carregar a demanda.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleEnviar() {
    if (teveCirurgia === null) {
      alert('Atenção', 'Informe se você passou por cirurgia recente.');
      return;
    }
    if (teveCirurgia && !consentimento) {
      alert('Atenção', 'É necessário autorizar o compartilhamento dessa informação com a empresa.');
      return;
    }

    setSubmitting(true);
    try {
      await api.enviarProposta({
        demand_id: Number(id),
        message: mensagem || undefined,
        had_recent_surgery: teveCirurgia,
        surgery_description: teveCirurgia ? descricaoCirurgia || undefined : undefined,
        health_consent: teveCirurgia ? consentimento : undefined,
      });
      alert('Proposta enviada!', 'A empresa foi notificada. Acompanhe o status em Minhas Propostas.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const e = err as ApiError;
      alert('Erro ao enviar proposta', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !data) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Detalhes da Demanda" />
        <View style={styles.centered}>
          <ActivityIndicator color={TEAL} size="large" />
        </View>
      </View>
    );
  }

  const { demanda, proposta, prestador_aprovado, prestador_tem_cnh } = data;
  const bloqueado = !prestador_aprovado || (demanda.exige_cnh && !prestador_tem_cnh);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Detalhes da Demanda" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{demanda.titulo}</Text>
        <Text style={styles.subtitle}>{demanda.empresa} · {demanda.servico}</Text>

        <View style={styles.infoCard}>
          <InfoRow label="Data" value={formatDate(demanda.data)} />
          <InfoRow label="Horário" value={`${formatTime(demanda.hora_inicio)}–${formatTime(demanda.hora_fim)}`} />
          <InfoRow label="Valor" value={`${formatCurrency(demanda.valor_hora)}/h`} />
          <InfoRow label="Vagas" value={`${demanda.vagas_confirmadas}/${demanda.vagas_necessarias}`} />
          {demanda.cidade ? <InfoRow label="Local" value={`${demanda.bairro ?? ''} ${demanda.cidade}/${demanda.estado ?? ''}`} /> : null}
        </View>

        {demanda.descricao ? (
          <>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{demanda.descricao}</Text>
          </>
        ) : null}

        {proposta ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Você já enviou uma proposta para esta demanda</Text>
            <Text style={styles.statusPill}>{STATUS_LABELS[proposta.status] ?? proposta.status}</Text>
          </View>
        ) : bloqueado ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>
              {!prestador_aprovado
                ? 'Seu cadastro ainda está em análise. Você poderá se candidatar assim que for aprovado.'
                : 'Este serviço exige CNH. Atualize seu perfil para se candidatar.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Candidatar-se</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Mensagem para a empresa (opcional)"
              value={mensagem}
              onChangeText={setMensagem}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.question}>Você passou por cirurgia recente?</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity
                style={[styles.choiceBtn, teveCirurgia === true && styles.choiceBtnActive]}
                onPress={() => setTeveCirurgia(true)}
              >
                <Text style={[styles.choiceBtnText, teveCirurgia === true && styles.choiceBtnTextActive]}>Sim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceBtn, teveCirurgia === false && styles.choiceBtnActive]}
                onPress={() => setTeveCirurgia(false)}
              >
                <Text style={[styles.choiceBtnText, teveCirurgia === false && styles.choiceBtnTextActive]}>Não</Text>
              </TouchableOpacity>
            </View>

            {teveCirurgia === true && (
              <>
                <TextInput
                  style={styles.textArea}
                  placeholder="Descreva brevemente a cirurgia"
                  value={descricaoCirurgia}
                  onChangeText={setDescricaoCirurgia}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity style={styles.checkboxRow} onPress={() => setConsentimento((v) => !v)}>
                  <View style={[styles.checkbox, consentimento && styles.checkboxChecked]} />
                  <Text style={styles.checkboxLabel}>
                    Autorizo o compartilhamento dessa informação com a empresa contratante.
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleEnviar}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Enviar proposta</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 4, marginBottom: 16 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#222', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginTop: 8, marginBottom: 8 },
  description: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 16 },
  statusCard: {
    backgroundColor: '#EEF3F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: { fontSize: 13, color: '#333', textAlign: 'center', lineHeight: 19 },
  statusPill: {
    backgroundColor: TEAL,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  question: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 8 },
  choiceRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  choiceBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: ORANGE,
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: 'center',
  },
  choiceBtnActive: { backgroundColor: ORANGE },
  choiceBtnText: { color: ORANGE, fontWeight: '700' },
  choiceBtnTextActive: { color: '#fff' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: ORANGE,
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: ORANGE },
  checkboxLabel: { flex: 1, fontSize: 12, color: '#444', lineHeight: 17 },
  submitBtn: {
    backgroundColor: ORANGE,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
