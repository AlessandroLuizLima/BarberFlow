/**
 * Serviço de integração com a API pública ViaCEP.
 * Documentação: https://viacep.com.br/
 */

/**
 * Consulta um CEP na API ViaCEP e retorna o endereço.
 * @param {string} cep - CEP com ou sem máscara (ex: "80000-000" ou "80000000")
 * @returns {Promise<{cep: string, logradouro: string, bairro: string, cidade: string, uf: string}>}
 */
async function buscarEnderecoPorCep(cep) {
  if (!cep) {
    throw new Error('CEP não informado');
  }

  const cepLimpo = String(cep).replace(/\D/g, '');

  if (cepLimpo.length !== 8) {
    throw new Error('CEP inválido: deve conter 8 dígitos');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

  if (!response.ok) {
    throw new Error('Não foi possível consultar o serviço ViaCEP');
  }

  const data = await response.json();

  if (data.erro) {
    throw new Error('CEP não encontrado');
  }

  return {
    cep: data.cep,
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    uf: data.uf
  };
}

module.exports = { buscarEnderecoPorCep };
