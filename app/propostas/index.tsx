import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { api, ApiError, PropostaListItem } from '@/services/api';
import { formatDate, formatTime } from '@/utils/format';
import { alert } from '@/utils/alert';

const TEAL = '#5BBCAD';
const ORANGE = '#E8603C';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando empresa',
  pending_company_accept: 'Aguardando empresa',
  pending_admin_approval: 'Em aprovação',
  accepted: 'Aceita',
  rejected: 'Recusada',
  rejected_provider: 'Cancelada',
  direct_pending: 'Convite recebido',
};

const CANCELABLE = ['pending', 'pending_company_accept'];

export default function PropostasScreen() {
  const [propostas, setPropostas] = useState<PropostaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.propostasPrestador();
      setPropostas(res.propostas);
    } catch (err) {
      const e = err as ApiError;
      alert('Erro', e.message ?? 'Não foi possível carregar suas propostas.');
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

  function handleCancelar(id: number) {
    alert('Cancelar proposta', 'Tem certeza que deseja cancelar esta proposta?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar proposta',
        style: 'destructive',
        onPress: async () => {
          setCancelingId(id);
          try {
            await api.cancelarProposta(id);
            await load(false);
          } catch (err) {
            const e = err as ApiError;
            alert('Erro', e.message);
          } finally {
            setCancelingId(null);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Minhas Propostas" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={TEAL} size="large" />
        </View>
      ) : (
        <FlatList
          data={propostas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} colors={[TEAL]} />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Você ainda não enviou propostas.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.demanda?.titulo ?? 'Demanda removida'}</Text>
                <Text style={styles.pill}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              </View>
              {item.demanda && (
                <>
                  <Text style={styles.cardSubtitle}>{item.demanda.empresa} · {item.demanda.servico}</Text>
                  <Text style={styles.cardMeta}>
                    {formatDate(item.demanda.data)} · {formatTime(item.demanda.hora_inicio)}–{formatTime(item.demanda.hora_fim)}
                  </Text>
                </>
              )}
              {item.mensagem ? <Text style={styles.cardMessage}>“{item.mensagem}”</Text> : null}

              {CANCELABLE.includes(item.status) && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancelar(item.id)}
                  disabled={cancelingId === item.id}
                >
                  {cancelingId === item.id
                    ? <ActivityIndicator color={ORANGE} size="small" />
                    : <Text style={styles.cancelBtnText}>Cancelar proposta</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20 },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222', flexShrink: 1 },
  cardSubtitle: { fontSize: 13, color: '#555', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  cardMessage: { fontSize: 12, color: '#666', marginTop: 8, fontStyle: 'italic' },
  pill: {
    backgroundColor: '#EEF3F2',
    color: TEAL,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelBtnText: { color: ORANGE, fontWeight: '700', fontSize: 13 },
});
