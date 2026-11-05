// Regras de senha usadas no cadastro, na troca de senha e na criação de contas do barbeiro.
// bcrypt só considera os primeiros 72 bytes, por isso o limite máximo.
function validarSenha(senha) {
  const texto = typeof senha === 'string' ? senha : '';
  if (texto.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (Buffer.byteLength(texto, 'utf8') > 72) return 'A senha deve ter no máximo 72 caracteres.';
  if (!/[A-Za-zÀ-ÿ]/.test(texto) || !/\d/.test(texto)) return 'A senha deve ter letras e números.';
  return null;
}

module.exports = { validarSenha };
