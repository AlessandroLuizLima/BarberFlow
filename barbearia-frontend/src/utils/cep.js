import { consultarCep } from '../services/clienteService';

// "84635000" -> "84635-000" (enquanto digita)
export const formatarCep = (valor) => {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
};

export const cepCompleto = (valor) => String(valor || '').replace(/\D/g, '').length === 8;

/**
 * Busca o endereço de um CEP. Usa o backend (/cep/:cep) e, se ele não responder,
 * consulta o ViaCEP direto do navegador (a API do ViaCEP libera CORS).
 * Cidades pequenas têm um CEP único: nesse caso logradouro e bairro vêm vazios
 * (geral = true) e o formulário deve deixar o usuário digitar a rua e o bairro.
 * @returns {Promise<{cep, logradouro, bairro, cidade, uf, geral: boolean}>}
 */
export async function buscarCep(valor) {
  const cep = String(valor || '').replace(/\D/g, '');
  if (cep.length !== 8) throw new Error('CEP deve ter 8 dígitos');

  let endereco;
  try {
    endereco = await consultarCep(cep);
  } catch (error) {
    // 400 do backend = CEP inexistente; outros erros = backend fora, tenta o ViaCEP direto
    if (error.response?.status === 400) throw new Error('CEP não encontrado');
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resposta.json();
    if (!resposta.ok || dados.erro) throw new Error('CEP não encontrado');
    endereco = { cep: dados.cep, logradouro: dados.logradouro, bairro: dados.bairro, cidade: dados.localidade, uf: dados.uf };
  }

  return {
    cep: endereco.cep || formatarCep(cep),
    logradouro: endereco.logradouro || '',
    bairro: endereco.bairro || '',
    cidade: endereco.cidade || '',
    uf: endereco.uf || '',
    geral: !endereco.logradouro
  };
}
