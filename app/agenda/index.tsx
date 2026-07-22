import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { api, AgendamentoListItem, ApiError } from '@/services/api';
import { formatDate, formatTime } from '@/utils/format';
import { alert } from '@/utils/alert';

const TEAL = '#5BBCAD';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function AgendaScreen() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.agendaPrestador({ todos: true });
      setAgendamentos(res.agendamentos);
    } catch (err) {
      const e = err as ApiError;
      alert('Erro', e.message ?? 'Não foi possível carregar sua agenda.');
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

  return (
    <View style={styles.container}>
      <ScreenHeader title="Minha Agenda" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={TEAL} size="large" />
        </View>
      ) : (
        <FlatList
          data={agendamentos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} colors={[TEAL]} />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.empresa}</Text>
                <Text style={styles.pill}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              </View>
              <Text style={styles.cardSubtitle}>{item.servico}</Text>
              <Text style={styles.cardMeta}>
                {formatDate(item.data)} · {formatTime(item.hora_inicio)}–{formatTime(item.hora_fim)}
              </Text>
              {item.cidade ? <Text style={styles.cardMeta}>{item.cidade}/{item.estado}</Text> : null}
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
});
