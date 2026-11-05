import { useState, useEffect, useCallback, useRef } from 'react';
import { obterClienteLogado } from '../services/authStorage';
import { buscarCliente } from '../services/clienteService';
import { temCoordenadas } from '../utils/geo';

// Localização atual do cliente, usada para ordenar as barbearias por proximidade.
//
// 1. Pede a posição ao navegador (GPS/Wi-Fi). Só funciona em HTTPS ou localhost.
// 2. Se o cliente negar ou não der certo, usa as coordenadas do endereço cadastrado
//    (o backend calcula a partir do CEP).
//
// status: 'carregando' | 'ativa' | 'negada' | 'indisponivel' | 'erro'
// origem: 'navegador' | 'endereco' | null
const OPCOES_GPS = {
  enableHighAccuracy: false, // precisão de bairro é suficiente e responde mais rápido
  timeout: 10000,
  maximumAge: 5 * 60 * 1000 // reaproveita uma posição de até 5 minutos atrás
};

const paraNumero = (valor) => (valor === null || valor === undefined || valor === '' ? NaN : Number(valor));

async function coordenadasDoEndereco() {
  const cliente = obterClienteLogado();
  if (!cliente?.id) return null;
  try {
    const atual = await buscarCliente(cliente.id);
    const ponto = { latitude: paraNumero(atual.latitude), longitude: paraNumero(atual.longitude) };
    return temCoordenadas(ponto) ? ponto : null;
  } catch {
    return null;
  }
}

export default function useLocalizacao() {
  const [posicao, setPosicao] = useState(null);
  const [status, setStatus] = useState('carregando');
  const [origem, setOrigem] = useState(null);
  const ativo = useRef(true);

  const usarEnderecoCadastrado = useCallback(async (statusSemEndereco) => {
    const ponto = await coordenadasDoEndereco();
    if (!ativo.current) return;
    if (ponto) {
      setPosicao(ponto);
      setOrigem('endereco');
    } else {
      setPosicao(null);
      setOrigem(null);
    }
    setStatus(statusSemEndereco);
  }, []);

  const solicitar = useCallback(() => {
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      usarEnderecoCadastrado('indisponivel');
      return;
    }
    setStatus('carregando');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!ativo.current) return;
        setPosicao({ latitude: coords.latitude, longitude: coords.longitude, precisaoMetros: coords.accuracy });
        setOrigem('navegador');
        setStatus('ativa');
      },
      (erro) => {
        usarEnderecoCadastrado(erro.code === erro.PERMISSION_DENIED ? 'negada' : 'erro');
      },
      OPCOES_GPS
    );
  }, [usarEnderecoCadastrado]);

  useEffect(() => {
    ativo.current = true;
    solicitar();
    return () => {
      ativo.current = false;
    };
  }, [solicitar]);

  return { posicao, status, origem, solicitar };
}
