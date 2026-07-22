import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Href, useRouter, useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { api, ApiError, DemandaListItem } from '@/services/api';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import { alert } from '@/utils/alert';

const TEAL = '#5BBCAD';
const ORANGE = '#E8603C';

export default function DemandasScreen() {
  const router = useRouter();
  const [demandas, setDemandas] = useState<DemandaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [meusServicos, setMeusServicos] = useState(false);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.demandasPrestador({ q: q || undefined, my_services: meusServicos || undefined });
      setDemandas(res.demandas);
    } catch (err) {
      const e = err as ApiError;
      alert('Erro', e.message ?? 'Não foi possível carregar as demandas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, meusServicos]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Buscar Demandas" />

      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título, cidade..."
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => load()}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.toggleBtn, meusServicos && styles.toggleBtnActive]}
          onPress={() => { setMeusServicos((v) => !v); }}
        >
          <Text style={[styles.toggleBtnText, meusServicos && styles.toggleBtnTextActive]}>Meus serviços</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={TEAL} size="large" />
        </View>
      ) : (
        <FlatList
          data={demandas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} colors={[TEAL]} />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma demanda disponível no momento.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/demandas/${item.id}` as Href)}>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardSubtitle}>{item.empresa} · {item.servico}</Text>
              <Text style={styles.cardMeta}>
                {formatDate(item.data)} · {formatTime(item.hora_inicio)}–{formatTime(item.hora_fim)} · {formatCurrency(item.valor_hora)}/h
              </Text>
              <Text style={styles.cardMeta}>{item.vagas_confirmadas}/{item.vagas_necessarias} vagas preenchidas</Text>
              {item.exige_cnh && <Text style={styles.cardBadge}>Exige CNH</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff' },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  toggleBtn: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: ORANGE },
  toggleBtnText: { color: ORANGE, fontSize: 12, fontWeight: '700' },
  toggleBtnTextActive: { color: '#fff' },
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  cardSubtitle: { fontSize: 13, color: '#555', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  cardBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3CD',
    color: '#8A6D3B',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
