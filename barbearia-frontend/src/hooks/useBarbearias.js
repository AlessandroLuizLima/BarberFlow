import { useState, useEffect, useMemo, useCallback } from 'react';
import { listarBarbeariasPublicas } from '../services/barbeariaService';
import { listarBarbearias, obterBarbearia } from '../data/barbearias';

// Barbearias exibidas ao cliente: as reais (assinatura ativa, vindas do banco) e as de demonstração.
// Mostra a última lista salva no navegador enquanto busca a atual.
const CHAVE_CACHE = 'barbeariasPublicas';

const lerCache = () => {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_CACHE) || '[]');
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
};

export default function useBarbearias() {
  const [reais, setReais] = useState(lerCache);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    listarBarbeariasPublicas()
      .then((lista) => {
        if (!ativo) return;
        setReais(lista);
        try { localStorage.setItem(CHAVE_CACHE, JSON.stringify(lista)); } catch { /* cache é opcional */ }
      })
      .catch((error) => console.error('Erro ao carregar barbearias:', error))
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  const barbearias = useMemo(() => listarBarbearias(reais), [reais]);
  const buscar = useCallback((id) => obterBarbearia(id, reais), [reais]);
  const primeiraReal = barbearias.find((b) => b.real) || null;
  return { barbearias, buscar, carregando, primeiraReal };
}
