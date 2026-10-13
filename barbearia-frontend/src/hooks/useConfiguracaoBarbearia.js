import { useState, useEffect } from 'react';
import { obterConfiguracao, lerCache, EVENTO_CONFIGURACAO } from '../services/configuracaoService';

// Configurações da barbearia (nome, logo, endereço...). Mostra o último valor salvo no navegador
// enquanto busca o atual e se atualiza sozinho quando o barbeiro salva as Configurações.
export default function useConfiguracaoBarbearia() {
  const [config, setConfig] = useState(lerCache());
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    obterConfiguracao()
      .then((c) => { if (ativo) setConfig(c); })
      .catch((error) => console.error('Erro ao carregar configurações da barbearia:', error))
      .finally(() => { if (ativo) setCarregando(false); });

    const aoSalvar = (e) => setConfig(e.detail);
    window.addEventListener(EVENTO_CONFIGURACAO, aoSalvar);

    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_CONFIGURACAO, aoSalvar);
    };
  }, []);

  return { config, carregando };
}
