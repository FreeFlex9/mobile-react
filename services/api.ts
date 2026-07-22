import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// No browser (expo web), SecureStore não está disponível — usa localStorage.
// No device (iOS/Android), usa SecureStore (criptografado).
const storage = {
  async set(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8000/api'
    : 'http://192.168.0.221:8000/api'; // IP da máquina na rede local

const TOKEN_KEY = 'freeflex_token';
const USER_KEY = 'freeflex_user';

export async function saveSession(token: string, user: User, userType: UserType) {
  await storage.set(TOKEN_KEY, token);
  await storage.set(USER_KEY, JSON.stringify({ ...user, user_type: userType }));
}

export async function getToken(): Promise<string | null> {
  return storage.get(TOKEN_KEY);
}

export async function getStoredUser(): Promise<(User & { user_type: UserType }) | null> {
  const raw = await storage.get(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
  await storage.remove(TOKEN_KEY);
  await storage.remove(USER_KEY);
}

export type UserType = 'prestador' | 'empresa';

export interface User {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  status_aprovacao: string;
}

export interface LoginResponse {
  token: string;
  user_type: UserType;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface AgendamentoPrestador {
  id: number;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  demanda_titulo: string | null;
  servico: string | null;
  empresa: string | null;
}

export interface PropostaPrestador {
  id: number;
  status: string;
  mensagem: string | null;
  criado_em: string;
  demanda: {
    id: number;
    titulo: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    servico: string | null;
  } | null;
}

export interface DemandaDisponivel {
  id: number;
  titulo: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  servico: string | null;
  valor_hora: string | null;
  empresa: string | null;
}

export interface PrestadorDashboard {
  provider: { id: number; nome: string; status_aprovacao: string };
  stats: {
    proposals_sent: number;
    proposals_pending: number;
    scheduled: number;
    avg_rating: number | null;
    ratings_count: number;
  };
  proximos_agendamentos: AgendamentoPrestador[];
  propostas_recentes: PropostaPrestador[];
  demandas_disponiveis: DemandaDisponivel[];
}

export interface DemandaEmpresa {
  id: number;
  titulo: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  vagas_necessarias: number;
  vagas_confirmadas: number;
  status: string;
  servico: string | null;
  propostas_count: number;
  agendamentos_count: number;
}

export interface AgendamentoEmpresa {
  id: number;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  demanda_titulo: string | null;
  prestador: string | null;
  prestador_telefone: string | null;
}

export interface PropostaPendenteEmpresa {
  id: number;
  mensagem: string | null;
  criado_em: string;
  prestador: string | null;
  demanda_id: number;
  demanda_titulo: string | null;
}

export interface EmpresaDashboard {
  company: { id: number; nome: string; status_aprovacao: string };
  stats: {
    open_demands: number;
    pending_proposals: number;
    scheduled: number;
    completed: number;
  };
  demandas_recentes: DemandaEmpresa[];
  proximos_agendamentos: AgendamentoEmpresa[];
  propostas_pendentes: PropostaPendenteEmpresa[];
}

export interface DemandaListItem {
  id: number;
  titulo: string;
  descricao: string | null;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  vagas_necessarias: number;
  vagas_confirmadas: number;
  servico: string | null;
  servico_id: number;
  exige_cnh: boolean;
  valor_hora: string | null;
  empresa: string | null;
  cidade: string | null;
  bairro: string | null;
  estado: string | null;
  distancia_km: number | null;
}

export interface DemandasResponse {
  demandas: DemandaListItem[];
  meus_servicos: { id: number; name: string }[];
  todos_servicos: { id: number; name: string }[];
  prestador_aprovado: boolean;
}

export interface DemandaDetalheResponse {
  demanda: DemandaListItem;
  proposta: { id: number; status: string; mensagem: string | null } | null;
  prestador_aprovado: boolean;
  prestador_tem_cnh: boolean;
}

export interface EnviarPropostaData {
  demand_id: number;
  message?: string;
  had_recent_surgery: boolean;
  surgery_description?: string;
  health_consent?: boolean;
}

export interface PropostaListItem {
  id: number;
  status: string;
  mensagem: string | null;
  criado_em: string;
  demanda: {
    id: number;
    titulo: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    servico: string | null;
    empresa: string | null;
  } | null;
}

export interface AgendamentoListItem {
  id: number;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  descricao: string | null;
  empresa: string | null;
  servico: string | null;
  demanda_id: number;
  cidade: string | null;
  estado: string | null;
}

function toQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: Record<string, unknown> | FormData,
  authenticated = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (authenticated) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    const err: ApiError = { message: json.message ?? 'Erro desconhecido.' };
    if (json.errors) err.errors = json.errors;
    throw err;
  }

  return json as T;
}

export const api = {
  login: (login: string, senha: string) =>
    request<LoginResponse>('POST', '/login', { login, senha }),

  logout: () => request('POST', '/logout', undefined, true),

  me: () => request<{ user_type: UserType; user: User }>('GET', '/me', undefined, true),

  servicos: () =>
    request<{ id: number; nome: string; valor_hora: string; precisa_cnh: boolean }[]>(
      'GET',
      '/servicos',
    ),

  registerPrestador: (data: FormData) =>
    request<{ message: string }>('POST', '/register/prestador', data),

  registerEmpresa: (data: FormData) =>
    request<{ message: string }>('POST', '/register/empresa', data),

  dashboardPrestador: () =>
    request<PrestadorDashboard>('GET', '/prestador/dashboard', undefined, true),

  aceitarConvitePrestador: (proposalId: number) =>
    request<{ message: string }>('POST', `/prestador/propostas/${proposalId}/aceitar`, undefined, true),

  recusarConvitePrestador: (proposalId: number) =>
    request<{ message: string }>('POST', `/prestador/propostas/${proposalId}/recusar`, undefined, true),

  demandasPrestador: (filters?: { q?: string; city?: string; service_id?: number; my_services?: boolean; sort?: string }) =>
    request<DemandasResponse>('GET', `/prestador/demandas${toQueryString(filters)}`, undefined, true),

  demandaPrestador: (id: number) =>
    request<DemandaDetalheResponse>('GET', `/prestador/demandas/${id}`, undefined, true),

  enviarProposta: (data: EnviarPropostaData) =>
    request<{ message: string; proposta_id: number }>('POST', '/prestador/demandas/proposta', data as unknown as Record<string, unknown>, true),

  propostasPrestador: (status?: string) =>
    request<{ propostas: PropostaListItem[] }>('GET', `/prestador/propostas${toQueryString({ status })}`, undefined, true),

  cancelarProposta: (proposalId: number) =>
    request<{ message: string }>('DELETE', `/prestador/propostas/${proposalId}/cancelar`, undefined, true),

  agendaPrestador: (params?: { mes?: number; ano?: number; todos?: boolean }) =>
    request<{ agendamentos: AgendamentoListItem[]; mes: number; ano: number }>('GET', `/prestador/agenda${toQueryString(params)}`, undefined, true),

  dashboardEmpresa: () =>
    request<EmpresaDashboard>('GET', '/empresa/dashboard', undefined, true),

  aceitarPropostaEmpresa: (proposalId: number) =>
    request<{ message: string }>('POST', `/empresa/propostas/${proposalId}/aceitar`, undefined, true),

  rejeitarPropostaEmpresa: (proposalId: number) =>
    request<{ message: string }>('POST', `/empresa/propostas/${proposalId}/rejeitar`, undefined, true),
};
