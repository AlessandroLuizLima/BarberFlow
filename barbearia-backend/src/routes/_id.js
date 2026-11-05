// Parâmetros de rota numéricos (/clientes/:id etc.): valor inválido responde 404
// em vez de chegar ao banco e gerar erro interno.
module.exports = function validarIdNumerico(req, res, next, valor) {
  if (/^[1-9]\d{0,9}$/.test(String(valor))) return next();
  return res.status(404).json({ error: 'Registro não encontrado' });
};
