import { useCallback, useEffect, useState } from 'react';
import { listarAgendamentos } from '../services/agendamentoService';
import { listarVendasProdutos } from '../services/produtoService';

// Agendamentos e vendas de produtos da barbearia logada (base do Financeiro e dos Relatórios)
export default function useMovimentoBarbearia() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const [lista, vendasProdutos] = await Promise.all([listarAgendamentos(), listarVendasProdutos().catch(() => [])]);
      setAgendamentos(lista);
      setVendas(vendasProdutos);
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível carregar os dados da barbearia.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  return { agendamentos, vendas, carregando, erro, recarregar: carregar };
}
