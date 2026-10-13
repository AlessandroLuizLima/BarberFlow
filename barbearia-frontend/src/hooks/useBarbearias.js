import { useMemo } from 'react';
import useConfiguracaoBarbearia from './useConfiguracaoBarbearia';
import { listarBarbearias, obterBarbearia } from '../data/barbearias';

// Barbearias exibidas ao cliente. A primeira é a real e acompanha as Configurações do barbeiro
// (nome, logo, endereço, horários); as outras são de demonstração.
export default function useBarbearias() {
  const { config, carregando } = useConfiguracaoBarbearia();
  const barbearias = useMemo(() => listarBarbearias(config), [config]);
  const buscar = (id) => obterBarbearia(id, config);
  return { barbearias, buscar, carregando, barbeariaReal: barbearias[0] };
}
