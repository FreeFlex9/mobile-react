import { unmask } from './masks';

export function validateCPF(cpf: string): boolean {
  const d = unmask(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(d[10]);
}

export function validateCNPJ(cnpj: string): boolean {
  const d = unmask(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;

  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

export function validatePhone(phone: string): boolean {
  const d = unmask(phone);
  return d.length >= 10 && d.length <= 11;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
