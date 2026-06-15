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

// No browser de desenvolvimento, o backend fica em localhost:8000.
// Em emulador Android, use http://10.0.2.2:8000/api.
// Em dispositivo físico, use http://SEU_IP_LOCAL:8000/api.
const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8000/api'
    : 'http://10.0.2.2:8000/api';

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
};
