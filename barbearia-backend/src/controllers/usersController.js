const Usuario = require('../models/users');

// CREATE - Criar usuário
exports.criarUsuario = async (req, res) => {
  try {
    const { nome_completo, email, telefone, senha } = req.body;
    const usuario = await Usuario.create({
      nome_completo,
      email,
      telefone,
      senha
    });

    res.status(201).json({ 
      message: `Usuário ${usuario.nome_completo} cadastrado com sucesso!`, 
      usuario 
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

// READ - Listar todos os usuários
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nome_completo', 'email', 'telefone'] // Não retorna a senha
    });
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ - Buscar usuário por ID
exports.buscarUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['senha'] } // Não retorna a senha
    });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE - Atualizar usuário
exports.atualizarUsuario = async (req, res) => {
  try {
    const { nome_completo, email, telefone, senha } = req.body;
    
    const [updated] = await Usuario.update(
      { nome_completo, email, telefone, senha },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuarioAtualizado = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['senha'] }
    });

    res.status(200).json({ 
      message: `Usuário ${usuarioAtualizado.nome_completo} atualizado com sucesso!`, 
      usuario: usuarioAtualizado 
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

// DELETE - Deletar usuário
exports.deletarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    await Usuario.destroy({ where: { id: req.params.id } });
    
    res.status(200).json({ 
      message: `Usuário ${usuario.nome_completo} deletado com sucesso!` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
