// Utilitários de telefone (Brasil): só aceita dígitos e formata como
// (XX) XXXX-XXXX (fixo) ou (XX) XXXXX-XXXX (celular).

export const apenasDigitos = (valor) => String(valor || '').replace(/\D/g, '').slice(0, 11);

export function formatarTelefone(valor) {
  const d = apenasDigitos(valor);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Válido = DDD + 8 dígitos (fixo) ou DDD + 9 dígitos (celular)
export function telefoneValido(valor) {
  const tamanho = apenasDigitos(valor).length;
  return tamanho === 10 || tamanho === 11;
}
