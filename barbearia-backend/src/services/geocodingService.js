/**
 * Geocodificação de endereços (endereço -> latitude/longitude) usando o Nominatim,
 * a API pública e gratuita do OpenStreetMap (não precisa de chave).
 * Documentação: https://nominatim.org/release-docs/latest/api/Search/
 *
 * Regras de uso do Nominatim: no máximo 1 requisição por segundo e um User-Agent
 * que identifique a aplicação. Por isso as consultas passam por uma fila simples
 * e os resultados ficam em cache na memória.
 *
 * Se a consulta falhar (sem internet, endereço não encontrado), devolve null e quem
 * chamou segue normalmente: as coordenadas só ficam em branco.
 */

const URL_NOMINATIM = process.env.GEOCODING_URL || 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = process.env.GEOCODING_USER_AGENT || 'BarberFlow/1.0 (sistema de agendamento para barbearias)';
const INTERVALO_MINIMO_MS = 1100;
const TIMEOUT_MS = 6000;

const cache = new Map();
let fila = Promise.resolve();
let ultimaRequisicao = 0;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Garante o intervalo mínimo entre duas chamadas ao Nominatim
function naFila(tarefa) {
  const execucao = fila.then(async () => {
    const espera = ultimaRequisicao + INTERVALO_MINIMO_MS - Date.now();
    if (espera > 0) await esperar(espera);
    ultimaRequisicao = Date.now();
    return tarefa();
  });
  fila = execucao.catch(() => {});
  return execucao;
}

async function consultar(parametros) {
  const chave = JSON.stringify(parametros);
  if (cache.has(chave)) return cache.get(chave);

  const url = new URL(URL_NOMINATIM);
  Object.entries({ ...parametros, format: 'jsonv2', limit: '1', countrycodes: 'br' }).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });

  const resposta = await naFila(() =>
    fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })
  );
  if (!resposta.ok) throw new Error(`Nominatim respondeu ${resposta.status}`);

  const [primeiro] = await resposta.json();
  const resultado = primeiro
    ? { latitude: Number(Number(primeiro.lat).toFixed(6)), longitude: Number(Number(primeiro.lon).toFixed(6)) }
    : null;
  cache.set(chave, resultado);
  return resultado;
}

/**
 * Busca as coordenadas de um endereço brasileiro.
 * Tenta primeiro com rua + número; se não achar, tenta só com CEP/cidade (menos preciso).
 * @param {{rua?: string, numero?: string, bairro?: string, cidade?: string, uf?: string, cep?: string}} endereco
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
async function geocodificarEndereco(endereco = {}) {
  if (process.env.GEOCODING_DESABILITADO === 'true') return null;

  const { rua, numero, cidade, uf, cep } = endereco;
  if (!cidade && !cep) return null;

  const tentativas = [];
  if (rua && cidade) {
    tentativas.push({ street: [numero, rua].filter(Boolean).join(' '), city: cidade, state: uf });
  }
  if (cep) tentativas.push({ postalcode: String(cep).replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2'), city: cidade, state: uf });
  if (cidade) tentativas.push({ city: cidade, state: uf });

  try {
    for (const parametros of tentativas) {
      const resultado = await consultar(parametros);
      if (resultado) return resultado;
    }
  } catch (error) {
    console.warn(`[geocoding] não foi possível localizar o endereço: ${error.message}`);
  }
  return null;
}

module.exports = { geocodificarEndereco };
