const bcrypt = require('bcryptjs');
const { Administrador } = require('../models');
const { gerarToken } = require('../middlewares/auth');
const { responderErroInterno } = require('../middlewares/seguranca');
const { validarSenha } = require('../utils/senha');

// Hash qualquer: compara mesmo quando o email não existe, para a resposta levar o mesmo tempo
// (evita descobrir quais emails têm conta medindo o tempo da resposta)
const HASH_FALSO = '$2b$12$e5teNY9/JA4SmK60ELNJWu2GRqOBXDVloHgHt/BjcQ63KRw2cWoyi';

const publico = (admin) => ({
  id: admin.id,
  nome: admin.nome,
  email: admin.email,
  barbearia_id: admin.barbearia_id,
  senha_temporaria: admin.senha_temporaria
});

// POST /auth/barbeiro/login - login do painel do barbeiro
exports.loginBarbeiro = async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const senha = String(req.body?.senha ?? '');
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

    const admin = await Administrador.scope('comSenha').findOne({ where: { email } });
    const senhaValida = admin
      ? await admin.verificarSenha(senha)
      : await bcrypt.compare(senha, HASH_FALSO);

    if (!admin || !senhaValida || !admin.ativo) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    await Administrador.update({ ultimo_login_em: new Date() }, { where: { id: admin.id }, hooks: false });
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token: gerarToken(admin, 'barbeiro'),
      barbeiro: publico(admin)
    });
  } catch (error) {
    responderErroInterno(res, error);
  }
};

// GET /auth/eu - quem está logado (usado pelo frontend para validar a sessão)
exports.eu = (req, res) => {
  res.status(200).json({ usuario: req.usuario });
};

// PUT /auth/barbeiro/senha - troca a senha do barbeiro logado (derruba as outras sessões)
exports.trocarSenhaBarbeiro = async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body || {};
    const erro = validarSenha(nova_senha);
    if (erro) return res.status(400).json({ error: erro });

    const admin = await Administrador.scope('comSenha').findByPk(req.usuario.id);
    if (!admin || !(await admin.verificarSenha(senha_atual))) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }
    if (await admin.verificarSenha(nova_senha)) {
      return res.status(400).json({ error: 'A nova senha precisa ser diferente da atual.' });
    }
    admin.senha = nova_senha;
    admin.senha_temporaria = false;
    await admin.save();
    res.status(200).json({ message: 'Senha alterada com sucesso!', token: gerarToken(admin, 'barbeiro'), barbeiro: publico(admin) });
  } catch (error) {
    responderErroInterno(res, error);
  }
};
