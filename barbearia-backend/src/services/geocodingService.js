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

const ESTADOS = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
  ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
};

async function consultar(parametros, uf) {
  const chave = JSON.stringify(parametros);
  if (cache.has(chave)) return cache.get(chave);

  const url = new URL(URL_NOMINATIM);
  Object.entries({ ...parametros, format: 'jsonv2', limit: '5', countrycodes: 'br', addressdetails: '1' }).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });

  const resposta = await naFila(() =>
    fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })
  );
  if (!resposta.ok) throw new Error(`Nominatim respondeu ${resposta.status}`);

  // Descarta resultados de outro estado (ex.: "Paulo Frontin/PR" x "Engenheiro Paulo de Frontin/RJ")
  const resultados = await resposta.json();
  const certo = resultados.find((r) => !uf || r.address?.['ISO3166-2-lvl4'] === `BR-${uf}`);
  const resultado = certo
    ? { latitude: Number(Number(certo.lat).toFixed(6)), longitude: Number(Number(certo.lon).toFixed(6)) }
    : null;
  cache.set(chave, resultado);
  return resultado;
}

/**
 * Busca as coordenadas de um endereço brasileiro.
 * Tenta do mais preciso (rua + número) para o menos preciso (só a cidade).
 * @param {{rua?: string, numero?: string, bairro?: string, cidade?: string, uf?: string, cep?: string}} endereco
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
async function geocodificarEndereco(endereco = {}) {
  if (process.env.GEOCODING_DESABILITADO === 'true') return null;

  const { rua, numero, bairro, cidade, cep } = endereco;
  const uf = String(endereco.uf || '').trim().toUpperCase();
  const estado = ESTADOS[uf] || uf;
  if (!cidade && !cep) return null;

  const cepFormatado = cep ? String(cep).replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2') : '';
  const tentativas = [];
  if (rua && cidade) {
    tentativas.push({ street: [numero, rua].filter(Boolean).join(' '), city: cidade, state: estado });
    tentativas.push({ q: [[rua, numero].filter(Boolean).join(', '), bairro, `${cidade} - ${estado}`, 'Brasil'].filter(Boolean).join(', ') });
  }
  if (cepFormatado) tentativas.push({ postalcode: cepFormatado, state: estado });
  if (cidade) tentativas.push({ city: cidade, state: estado });

  try {
    for (const parametros of tentativas) {
      const resultado = await consultar(parametros, ESTADOS[uf] ? uf : null);
      if (resultado) return resultado;
    }
  } catch (error) {
    console.warn(`[geocoding] não foi possível localizar o endereço: ${error.message}`);
  }
  return null;
}

module.exports = { geocodificarEndereco };
