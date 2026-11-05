const { Contato } = require('../models');
const { enviarEmail } = require('../services/emailService');
const { responderErroInterno } = require('../middlewares/seguranca');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERFIS = { cliente: 'Cliente', barbeiro: 'Barbeiro / dono de barbearia', outro: 'Outro' };
const texto = (v, max) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);

// E-mail da equipe de suporte que recebe as mensagens (SUPORTE_EMAIL no .env)
const emailDoSuporte = () => process.env.SUPORTE_EMAIL || process.env.SMTP_USER || null;

// POST /contato - formulário "Entre em contato" da página inicial.
// A mensagem vai para o suporte com "Responder para" = e-mail de quem escreveu:
// a equipe responde direto pelo Gmail e a resposta chega na caixa da pessoa.
exports.enviarContato = async (req, res) => {
  try {
    const corpo = req.body || {};
    // Campo escondido no formulário: pessoas não preenchem, robôs de spam sim
    if (corpo.site) return res.status(200).json({ message: 'Mensagem enviada! Responderemos no seu e-mail em até 24 horas.' });

    const nome = texto(corpo.nome, 100);
    const email = texto(corpo.email, 150).toLowerCase();
    const perfil = PERFIS[corpo.perfil] ? corpo.perfil : 'outro';
    const assunto = texto(corpo.assunto, 150).replace(/\n+/g, ' ');
    const mensagem = texto(corpo.mensagem, 5000);

    if (nome.length < 2) return res.status(400).json({ error: 'Informe seu nome.' });
    if (!REGEX_EMAIL.test(email)) return res.status(400).json({ error: 'Email inválido.' });
    if (assunto.length < 3) return res.status(400).json({ error: 'Informe o assunto.' });
    if (mensagem.length < 10) return res.status(400).json({ error: 'Escreva uma mensagem com pelo menos 10 caracteres.' });

    const destino = emailDoSuporte();
    const resultado = destino
      ? await enviarEmail({
          para: destino,
          responderPara: `"${nome.replace(/["\r\n]/g, '')}" <${email}>`,
          assunto: `[Contato] ${assunto}`,
          nomeRemetente: 'Site BarberFlow',
          conteudo: {
            assunto: `[Contato] ${assunto}`,
            titulo: assunto,
            paragrafos: mensagem.split(/\n{2,}|\n/).filter(Boolean),
            linhas: [['Nome', nome], ['E-mail', email], ['Perfil', PERFIS[perfil]]],
            rodape: 'Para responder, use "Responder" no seu e-mail: a resposta vai direto para quem escreveu.'
          }
        })
      : { status: 'falhou', erro: 'SUPORTE_EMAIL não configurado' };

    await Contato.create({ nome, email, perfil, assunto, mensagem, status_envio: resultado.status });

    if (resultado.status === 'falhou') {
      console.error('[contato] não foi possível enviar ao suporte:', resultado.erro);
      return res.status(502).json({ error: 'Não foi possível enviar sua mensagem agora. Tente novamente em alguns minutos.' });
    }
    res.status(200).json({ message: 'Mensagem enviada! Responderemos no seu e-mail em até 24 horas.' });
  } catch (error) {
    responderErroInterno(res, error);
  }
};
