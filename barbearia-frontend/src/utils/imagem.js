// Reduz a imagem escolhida (logo da barbearia ou foto de perfil) para no máximo 256px
// no maior lado e devolve um data URL, que o backend converte e grava na tabela de imagens.
// Mantém a transparência de PNG/WEBP/GIF; fotos (JPG) viram JPEG comprimido.
// O limite fica abaixo dos 512 KB aceitos pelo backend (base64 ocupa ~33% a mais).
const LIMITE_CARACTERES = 600000;
const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const TAMANHO_MAXIMO_ARQUIVO = 5 * 1024 * 1024; // arquivo original escolhido pelo usuário

const lerArquivo = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });

const carregarImagem = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
    img.src = src;
  });

export async function prepararImagem(file) {
  if (!file || !TIPOS_ACEITOS.includes(file.type)) {
    throw new Error('Formato não suportado. Use PNG, JPG, WEBP ou GIF.');
  }
  if (file.size > TAMANHO_MAXIMO_ARQUIVO) {
    throw new Error('O arquivo deve ter no máximo 5MB.');
  }

  const img = await carregarImagem(await lerArquivo(file));
  const comTransparencia = ['image/png', 'image/webp', 'image/gif'].includes(file.type);

  for (const lado of [256, 192, 128]) {
    const escala = Math.min(1, lado / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * escala));
    canvas.height = Math.max(1, Math.round(img.height * escala));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

    const resultado = comTransparencia
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', 0.85);

    if (resultado.length <= LIMITE_CARACTERES) return resultado;
  }
  throw new Error('A imagem é muito pesada. Escolha uma imagem menor.');
}

// Nome mantido para o painel do barbeiro (Configurações > logo)
export const prepararLogo = prepararImagem;
