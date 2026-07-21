export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '--/--';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '--:--';
  return time.slice(0, 5);
}

export function formatCurrency(value: string | number | null | undefined): string {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return '--';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
