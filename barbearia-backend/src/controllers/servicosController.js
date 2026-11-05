const { Servico } = require('../models');
const { ehBarbeiro } = require('../middlewares/auth');
const { responderErroInterno, respostaDeValidacao } = require('../middlewares/seguranca');

const responderErro = (res, error) => {
  const validacao = respostaDeValidacao(error);
  if (validacao) return res.status(400).json({ error: validacao });
  return responderErroInterno(res, error);
};

const idValido = (valor) => /^[1-9]\d{0,9}$/.test(String(valor ?? ''));

// Barbeiro só mexe nos serviços da barbearia dele (outro responde 404)
async function buscarDaBarbearia(req, id) {
  const servico = await Servico.findByPk(id);
  if (!servico) return null;
  if (ehBarbeiro(req) && servico.barbearia_id !== req.usuario.barbearia_id) return null;
  return servico;
}

// Só os campos editáveis, com tipos conferidos (impede enviar id, datas etc.)
function lerServico(corpo = {}, parcial = false) {
  const dados = {};
  if (corpo.nome !== undefined || !parcial) {
    const nome = String(corpo.nome ?? '').trim();
    if (!nome || nome.length > 100) return { erro: 'Informe um nome de até 100 caracteres.' };
    dados.nome = nome;
  }
  if (corpo.descricao !== undefined) {
    const descricao = String(corpo.descricao ?? '').trim();
    if (descricao.length > 255) return { erro: 'A descrição deve ter até 255 caracteres.' };
    dados.descricao = descricao || null;
  }
  if (corpo.duracao_minutos !== undefined || !parcial) {
    const duracao = Number(corpo.duracao_minutos);
    if (!Number.isInteger(duracao) || duracao < 5 || duracao > 600) return { erro: 'A duração deve ser entre 5 e 600 minutos.' };
    dados.duracao_minutos = duracao;
  }
  if (corpo.preco !== undefined || !parcial) {
    const preco = Number(corpo.preco);
    if (!Number.isFinite(preco) || preco < 0 || preco > 100000) return { erro: 'Preço inválido.' };
    dados.preco = Math.round(preco * 100) / 100;
  }
  if (corpo.ativo !== undefined) dados.ativo = Boolean(corpo.ativo);
  return { dados };
}

exports.criarServico = async (req, res) => {
  try {
    const { dados, erro } = lerServico(req.body);
    if (erro) return res.status(400).json({ error: erro });
    const servico = await Servico.create({ ...dados, barbearia_id: req.usuario.barbearia_id });
    res.status(201).json({ message: `Serviço ${servico.nome} cadastrado com sucesso!`, servico });
  } catch (error) {
    responderErro(res, error);
  }
};

exports.listarServicos = async (req, res) => {
  try {
    // Barbeiro vê os da barbearia dele (inclusive inativos); clientes informam a barbearia
    let where;
    if (ehBarbeiro(req)) where = { barbearia_id: req.usuario.barbearia_id };
    else {
      const barbeariaId = req.params.barbeariaId ?? req.query.barbearia_id;
      if (!idValido(barbeariaId)) return res.status(400).json({ error: 'Informe a barbearia (barbearia_id).' });
      where = { barbearia_id: Number(barbeariaId), ativo: true };
    }
    const servicos = await Servico.findAll({ where, order: [['nome', 'ASC']] });
    res.status(200).json(servicos);
  } catch (error) {
    responderErro(res, error);
  }
};

exports.buscarServicoPorId = async (req, res) => {
  try {
    const servico = await buscarDaBarbearia(req, req.params.id);
    if (!servico) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    res.status(200).json(servico);
  } catch (error) {
    responderErro(res, error);
  }
};

exports.atualizarServico = async (req, res) => {
  try {
    const servico = await buscarDaBarbearia(req, req.params.id);
    if (!servico) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    const { dados, erro } = lerServico(req.body, true);
    if (erro) return res.status(400).json({ error: erro });
    await servico.update(dados);
    res.status(200).json({ message: `Serviço ${servico.nome} atualizado com sucesso!`, servico });
  } catch (error) {
    responderErro(res, error);
  }
};

exports.deletarServico = async (req, res) => {
  try {
    const servico = await buscarDaBarbearia(req, req.params.id);
    if (!servico) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    await servico.destroy();
    res.status(200).json({ message: `Serviço ${servico.nome} deletado com sucesso!` });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ error: 'Este serviço possui agendamentos. Desative-o em vez de excluir.' });
    }
    responderErro(res, error);
  }
};
