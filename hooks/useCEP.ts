import { useState } from 'react';
import { unmask } from '@/utils/masks';

export interface AddressFromCEP {
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export function useCEP(onFill: (address: AddressFromCEP) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(cep: string) {
    const digits = unmask(cep);
    if (digits.length !== 8) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError('CEP não encontrado.');
        return;
      }
      onFill({
        endereco: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        cidade: data.localidade ?? '',
        estado: data.uf ?? '',
      });
    } catch {
      setError('Não foi possível buscar o CEP. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading, error };
}
