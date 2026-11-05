/**
 * Armazenamento de imagens (logo da barbearia e fotos de perfil).
 *
 * O frontend já reduz a imagem (até 256px) e a envia como data URL em base64.
 * Aqui ela é validada (tipo real pelo conteúdo do arquivo + tamanho), convertida
 * para binário e gravada na tabela "imagens". As tabelas principais guardam só o id,
 * e a imagem é servida por GET /imagens/:id com cache longo (cada envio gera um id novo).
 */
const { Imagem } = require('../models');

const TAMANHO_MAXIMO_BYTES = 512 * 1024; // 512 KB depois de decodificado
const REGEX_DATA_URL = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

// Confere a "assinatura" (primeiros bytes) do arquivo: o tipo declarado precisa bater com o conteúdo
const ASSINATURAS = {
  'image/png': (b) => b.length > 8 && b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG',
  'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/gif': (b) => b.length > 6 && b.toString('ascii', 0, 4) === 'GIF8',
  'image/webp': (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
};

class ErroImagem extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.status = 400;
  }
}

const ehDataUrl = (valor) => typeof valor === 'string' && valor.startsWith('data:');

function decodificar(dataUrl) {
  const partes = typeof dataUrl === 'string' ? REGEX_DATA_URL.exec(dataUrl) : null;
  if (!partes) throw new ErroImagem('Imagem inválida. Envie um arquivo PNG, JPG, WEBP ou GIF.');

  const [, mime, base64] = partes;
  const dados = Buffer.from(base64, 'base64');

  if (dados.length > TAMANHO_MAXIMO_BYTES) throw new ErroImagem('A imagem é muito grande. Use uma imagem de até 500 KB.');
  if (!ASSINATURAS[mime](dados)) throw new ErroImagem('O conteúdo do arquivo não corresponde a uma imagem válida.');

  return { mime, dados };
}

// Grava uma nova imagem e devolve o id
async function salvarImagem(dataUrl, { transaction } = {}) {
  const { mime, dados } = decodificar(dataUrl);
  const imagem = await Imagem.create(
    { mime_type: mime, dados, tamanho_bytes: dados.length },
    { transaction }
  );
  return imagem.id;
}

async function removerImagem(id, { transaction } = {}) {
  if (!id) return;
  await Imagem.destroy({ where: { id }, transaction });
}

// Caminho público da imagem (relativo ao backend). O frontend completa com a URL da API.
const urlDaImagem = (id) => (id ? `/imagens/${id}` : null);

module.exports = { salvarImagem, removerImagem, urlDaImagem, ehDataUrl, ErroImagem, TAMANHO_MAXIMO_BYTES };
