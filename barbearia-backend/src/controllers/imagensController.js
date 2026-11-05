const { Imagem } = require('../models');
const { responderErroInterno } = require('../middlewares/seguranca');

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// READ - Devolve o arquivo da imagem (usado direto no <img src>)
// Cada envio de foto/logo gera um id novo, então o navegador pode guardar em cache "para sempre".
exports.obterImagem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!REGEX_UUID.test(id)) return res.status(404).json({ error: 'Imagem não encontrada' });

    const imagem = await Imagem.findByPk(id);
    if (!imagem) return res.status(404).json({ error: 'Imagem não encontrada' });

    res.set({
      'Content-Type': imagem.mime_type,
      'Content-Length': imagem.tamanho_bytes,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      // permite usar a imagem em outro domínio (frontend e backend ficam em hosts diferentes)
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    res.send(imagem.dados);
  } catch (error) {
    responderErroInterno(res, error);
  }
};
