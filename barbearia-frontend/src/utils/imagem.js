// Reduz a imagem escolhida para caber como logo (quadrada, até 256px) e devolve um data URL.
// Mantém a transparência de PNG/WEBP/GIF; fotos (JPG) viram JPEG comprimido.
const LIMITE_CARACTERES = 600000;

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

export async function prepararLogo(file) {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    throw new Error('Formato não suportado. Use PNG, JPG, WEBP ou GIF.');
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
