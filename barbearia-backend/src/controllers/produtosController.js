const { Op } = require('sequelize');
const { sequelize, Produto, VendaProduto } = require('../models');
const { responderErroInterno, respostaDeValidacao } = require('../middlewares/seguranca');

// Produtos e vendas do painel: tudo sempre da barbearia do barbeiro logado.
const responderErro = (res, error) => {
  const validacao = respostaDeValidacao(error);
  if (validacao) return res.status(400).json({ error: validacao });
  return responderErroInterno(res, error);
};

const buscarDaBarbearia = (req, id, opcoes = {}) =>
  Produto.findOne({ where: { id, barbearia_id: req.usuario.barbearia_id }, ...opcoes });

const dinheiro = (valor) => Math.round(Number(valor) * 100) / 100;

// Só os campos editáveis, com tipos conferidos
function lerProduto(corpo = {}, parcial = false) {
  const dados = {};
  const precisa = (campo) => corpo[campo] !== undefined || !parcial;
  if (precisa('nome')) {
    const nome = String(corpo.nome ?? '').trim();
    if (nome.length < 2 || nome.length > 100) return { erro: 'Informe um nome de 2 a 100 caracteres.' };
    dados.nome = nome;
  }
  if (corpo.descricao !== undefined) {
    const descricao = String(corpo.descricao ?? '').trim();
    if (descricao.length > 255) return { erro: 'A descrição deve ter até 255 caracteres.' };
    dados.descricao = descricao || null;
  }
  if (precisa('categoria')) {
    if (!Produto.CATEGORIAS.includes(corpo.categoria)) return { erro: `Categoria inválida. Use: ${Produto.CATEGORIAS.join(', ')}.` };
    dados.categoria = corpo.categoria;
  }
  if (precisa('preco')) {
    const preco = Number(corpo.preco);
    if (!Number.isFinite(preco) || preco < 0 || preco > 100000) return { erro: 'Preço de venda inválido.' };
    dados.preco = dinheiro(preco);
  }
  if (corpo.custo !== undefined) {
    const custo = Number(corpo.custo || 0);
    if (!Number.isFinite(custo) || custo < 0 || custo > 100000) return { erro: 'Custo inválido.' };
    dados.custo = dinheiro(custo);
  }
  if (precisa('quantidade')) {
    const quantidade = Number(corpo.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 0 || quantidade > 100000) return { erro: 'Estoque deve ser um número inteiro de 0 a 100000.' };
    dados.quantidade = quantidade;
  }
  if (corpo.ativo !== undefined) dados.ativo = Boolean(corpo.ativo);
  return { dados };
}

// Lista com o total vendido de cada produto
exports.listarProdutos = async (req, res) => {
  try {
    const produtos = await Produto.findAll({ where: { barbearia_id: req.usuario.barbearia_id }, order: [['nome', 'ASC']] });
    const totais = await VendaProduto.findAll({
      attributes: ['produto_id', [sequelize.fn('SUM', sequelize.col('quantidade')), 'vendidos']],
      where: { barbearia_id: req.usuario.barbearia_id },
      group: ['produto_id'],
      raw: true
    });
    const vendidos = Object.fromEntries(totais.map((t) => [t.produto_id, Number(t.vendidos)]));
    res.json(produtos.map((p) => ({ ...p.toJSON(), vendidos: vendidos[p.id] || 0 })));
  } catch (error) {
    responderErro(res, error);
  }
};

exports.criarProduto = async (req, res) => {
  try {
    const { dados, erro } = lerProduto(req.body);
    if (erro) return res.status(400).json({ error: erro });
    const produto = await Produto.create({ ...dados, barbearia_id: req.usuario.barbearia_id });
    res.status(201).json({ message: 'Produto cadastrado.', produto: { ...produto.toJSON(), vendidos: 0 } });
  } catch (error) {
    responderErro(res, error);
  }
};

exports.atualizarProduto = async (req, res) => {
  try {
    const produto = await buscarDaBarbearia(req, req.params.id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    const { dados, erro } = lerProduto(req.body, true);
    if (erro) return res.status(400).json({ error: erro });
    await produto.update(dados);
    res.json({ message: 'Produto atualizado.', produto });
  } catch (error) {
    responderErro(res, error);
  }
};

exports.excluirProduto = async (req, res) => {
  try {
    const produto = await buscarDaBarbearia(req, req.params.id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    await produto.destroy();
    res.json({ message: 'Produto excluído.' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ error: 'Este produto já tem vendas registradas. Desative-o em vez de excluir.' });
    }
    responderErro(res, error);
  }
};

// Registra uma venda: baixa o estoque e guarda o valor (entra no Financeiro)
exports.registrarVenda = async (req, res) => {
  const quantidade = Number(req.body?.quantidade ?? 1);
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 1000) {
    return res.status(400).json({ error: 'Quantidade deve ser um número inteiro de 1 a 1000.' });
  }
  try {
    const resultado = await sequelize.transaction(async (transaction) => {
      // Trava a linha: duas vendas ao mesmo tempo não deixam o estoque negativo
      const produto = await buscarDaBarbearia(req, req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!produto) return { status: 404, corpo: { error: 'Produto não encontrado' } };
      if (!produto.ativo) return { status: 409, corpo: { error: 'Produto desativado. Ative-o para vender.' } };
      if (produto.quantidade < quantidade) {
        return { status: 409, corpo: { error: `Estoque insuficiente: restam ${produto.quantidade} unidade(s).` } };
      }
      const venda = await VendaProduto.create({
        barbearia_id: produto.barbearia_id,
        produto_id: produto.id,
        quantidade,
        valor_unitario: produto.preco,
        custo_unitario: produto.custo
      }, { transaction });
      await produto.decrement('quantidade', { by: quantidade, transaction });
      await produto.reload({ transaction });
      return { status: 201, corpo: { message: 'Venda registrada.', venda, produto } };
    });
    res.status(resultado.status).json(resultado.corpo);
  } catch (error) {
    responderErro(res, error);
  }
};

// Vendas de produtos (para o Financeiro e Relatórios). ?desde=AAAA-MM-DD opcional.
exports.listarVendas = async (req, res) => {
  try {
    const where = { barbearia_id: req.usuario.barbearia_id };
    if (req.query.desde) {
      const desde = new Date(`${req.query.desde}T00:00:00`);
      if (Number.isNaN(desde.getTime())) return res.status(400).json({ error: 'Data inválida (use AAAA-MM-DD).' });
      where.criado_em = { [Op.gte]: desde };
    }
    const vendas = await VendaProduto.findAll({
      where,
      include: [{ model: Produto, as: 'produto', attributes: ['id', 'nome', 'categoria'] }],
      order: [['criado_em', 'DESC']],
      limit: 5000
    });
    res.json(vendas);
  } catch (error) {
    responderErro(res, error);
  }
};
