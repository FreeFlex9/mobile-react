import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatCard } from './StatCard';
import { StatusBanner } from './StatusBanner';
import { api, ApiError, PrestadorDashboard as PrestadorDashboardData } from '@/services/api';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';

const TEAL = '#5BBCAD';
const ORANGE = '#E8603C';

export function PrestadorDashboard() {
  const [data, setData] = useState<PrestadorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.dashboardPrestador();
      setData(res);
    } catch (err) {
      const e = err as ApiError;
      Alert.alert('Erro', e.message ?? 'Não foi possível carregar o dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleConvite(proposalId: number, aceitar: boolean) {
    setActionLoadingId(proposalId);
    try {
      if (aceitar) await api.aceitarConvitePrestador(proposalId);
      else await api.recusarConvitePrestador(proposalId);
      await load(false);
    } catch (err) {
      const e = err as ApiError;
      Alert.alert('Erro', e.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={TEAL} size="large" />
      </View>
    );
  }

  if (!data) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} colors={[TEAL]} />
      }
    >
      <Text style={styles.greeting}>Olá, {data.provider.nome.split(' ')[0]}</Text>
      <StatusBanner status={data.provider.status_aprovacao} />

      <View style={styles.statsGrid}>
        <StatCard label="Propostas enviadas" value={data.stats.proposals_sent} />
        <StatCard label="Pendentes" value={data.stats.proposals_pending} />
        <StatCard label="Agendamentos" value={data.stats.scheduled} />
        <StatCard label="Avaliação média" value={data.stats.avg_rating ?? '—'} />
      </View>

      <Text style={styles.sectionTitle}>Próximos agendamentos</Text>
      {data.proximos_agendamentos.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum agendamento futuro.</Text>
      ) : (
        data.proximos_agendamentos.map((a) => (
          <View key={a.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{a.demanda_titulo}</Text>
            <Text style={styles.itemSubtitle}>{a.empresa} · {a.servico}</Text>
            <Text style={styles.itemMeta}>{formatDate(a.data)} · {formatTime(a.hora_inicio)}–{formatTime(a.hora_fim)}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Propostas recentes</Text>
      {data.propostas_recentes.length === 0 ? (
        <Text style={styles.emptyText}>Você ainda não enviou propostas.</Text>
      ) : (
        data.propostas_recentes.map((p) => (
          <View key={p.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{p.demanda?.titulo ?? 'Demanda removida'}</Text>
              <StatusPill status={p.status} />
            </View>
            {p.demanda && (
              <Text style={styles.itemMeta}>{formatDate(p.demanda.data)} · {formatTime(p.demanda.hora_inicio)}–{formatTime(p.demanda.hora_fim)}</Text>
            )}
            {p.status === 'direct_pending' && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={() => handleConvite(p.id, false)}
                  disabled={actionLoadingId === p.id}
                >
                  <Text style={styles.actionBtnOutlineText}>Recusar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnFilled]}
                  onPress={() => handleConvite(p.id, true)}
                  disabled={actionLoadingId === p.id}
                >
                  {actionLoadingId === p.id
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.actionBtnFilledText}>Aceitar</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Demandas disponíveis</Text>
      {data.demandas_disponiveis.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma demanda disponível no momento.</Text>
      ) : (
        data.demandas_disponiveis.map((d) => (
          <View key={d.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{d.titulo}</Text>
            <Text style={styles.itemSubtitle}>{d.empresa} · {d.servico}</Text>
            <Text style={styles.itemMeta}>{formatDate(d.data)} · {formatTime(d.hora_inicio)}–{formatTime(d.hora_fim)} · {formatCurrency(d.valor_hora)}/h</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando empresa',
  pending_company_accept: 'Aguardando empresa',
  pending_admin_approval: 'Em aprovação',
  accepted: 'Aceita',
  rejected: 'Recusada',
  rejected_provider: 'Recusada por você',
  direct_pending: 'Convite recebido',
};

function StatusPill({ status }: { status: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7F7' },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginTop: 24, marginBottom: 10 },
  emptyText: { fontSize: 13, color: '#888' },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#222', flexShrink: 1 },
  itemSubtitle: { fontSize: 13, color: '#555', marginTop: 2 },
  itemMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  pill: { backgroundColor: '#EEF3F2', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, color: TEAL, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 20, paddingVertical: 9, alignItems: 'center' },
  actionBtnOutline: { borderWidth: 1.5, borderColor: ORANGE, backgroundColor: '#fff' },
  actionBtnOutlineText: { color: ORANGE, fontWeight: '700', fontSize: 13 },
  actionBtnFilled: { backgroundColor: ORANGE },
  actionBtnFilledText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
