const { ListaEspera, Cliente, Profissional, Servico } = require('../models');

const includePadrao = [
  { model: Cliente, as: 'cliente', attributes: { exclude: ['senha'] } },
  { model: Profissional, as: 'profissional' },
  { model: Servico, as: 'servico' }
];

// CREATE - Cliente entra na lista de espera de um profissional/serviço para um dia desejado
exports.entrarNaListaDeEspera = async (req, res) => {
  try {
    const { cliente_id, profissional_id, servico_id, data_desejada } = req.body;

    if (!cliente_id || !profissional_id || !servico_id || !data_desejada) {
      return res.status(400).json({ error: 'cliente_id, profissional_id, servico_id e data_desejada são obrigatórios' });
    }

    const [cliente, profissional, servico] = await Promise.all([
      Cliente.findByPk(cliente_id),
      Profissional.findByPk(profissional_id),
      Servico.findByPk(servico_id)
    ]);

    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (!profissional) return res.status(404).json({ error: 'Profissional não encontrado' });
    if (!servico) return res.status(404).json({ error: 'Serviço não encontrado' });

    const entrada = await ListaEspera.create({ cliente_id, profissional_id, servico_id, data_desejada });

    res.status(201).json({ message: 'Você entrou na lista de espera!', listaEspera: entrada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ - Listar entradas da lista de espera (filtros opcionais)
exports.listarListaDeEspera = async (req, res) => {
  try {
    const { cliente_id, profissional_id, status } = req.query;
    const where = {};
    if (cliente_id) where.cliente_id = cliente_id;
    if (profissional_id) where.profissional_id = profissional_id;
    if (status) where.status = status;

    const entradas = await ListaEspera.findAll({ where, include: includePadrao, order: [['id', 'ASC']] });
    res.status(200).json(entradas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE - Sair da lista de espera
exports.sairDaListaDeEspera = async (req, res) => {
  try {
    const entrada = await ListaEspera.findByPk(req.params.id);
    if (!entrada) {
      return res.status(404).json({ message: 'Registro não encontrado na lista de espera' });
    }
    await entrada.destroy();
    res.status(200).json({ message: 'Removido da lista de espera com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
