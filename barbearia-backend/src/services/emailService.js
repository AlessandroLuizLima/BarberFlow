/**
 * Envio de e-mails por SMTP (Nodemailer). Funciona com qualquer provedor SMTP:
 * Gmail (com "senha de app"), Outlook, Brevo, Mailtrap, SendGrid...
 *
 * Configuração no .env do backend:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (opcional)
 *
 * Sem SMTP configurado, o e-mail não é enviado: aparece no console como
 * "simulado" e a função devolve { status: 'simulado' }. Assim o sistema
 * funciona em desenvolvimento sem precisar de conta de e-mail.
 */
const nodemailer = require('nodemailer');

let transportador = null;

const smtpConfigurado = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function obterTransportador() {
  if (!smtpConfigurado()) return null;
  if (!transportador) {
    const porta = Number(process.env.SMTP_PORT || 587);
    transportador = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: porta,
      secure: porta === 465, // 465 = SSL direto; 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
  }
  return transportador;
}

const escaparHtml = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Monta um e-mail simples e legível em qualquer cliente de e-mail.
 * @param {{titulo: string, paragrafos: string[], linhas?: [string, string][], rodape?: string}} conteudo
 */
function montarHtml({ titulo, paragrafos = [], linhas = [], rodape = '' }) {
  const tabela = linhas.length
    ? `<table style="border-collapse:collapse;margin:16px 0;width:100%">${linhas
        .map(([rotulo, valor]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${escaparHtml(rotulo)}</td>` +
          `<td style="padding:6px 0;color:#111827;font-weight:600">${escaparHtml(valor)}</td></tr>`)
        .join('')}</table>`
    : '';
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb">
    <div style="font-size:13px;font-weight:700;letter-spacing:.05em;color:#3b82f6;text-transform:uppercase">BarberFlow</div>
    <h1 style="font-size:20px;color:#111827;margin:8px 0 16px">${escaparHtml(titulo)}</h1>
    ${paragrafos.map((p) => `<p style="font-size:15px;line-height:1.5;color:#374151;margin:0 0 12px">${escaparHtml(p)}</p>`).join('')}
    ${tabela}
  </div>
  ${rodape ? `<p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:16px">${escaparHtml(rodape)}</p>` : ''}
</div></body></html>`;
}

function montarTexto({ titulo, paragrafos = [], linhas = [], rodape = '' }) {
  return [titulo, '', ...paragrafos, '', ...linhas.map(([r, v]) => `${r}: ${v}`), '', rodape].join('\n').trim();
}

/**
 * Envia um e-mail. Nunca lança erro: devolve o resultado para quem chamou registrar.
 * @returns {Promise<{status: 'enviado'|'simulado'|'falhou', erro?: string}>}
 */
async function enviarEmail({ para, assunto, conteudo, nomeRemetente = 'BarberFlow' }) {
  if (!para) return { status: 'falhou', erro: 'Sem e-mail de destino' };

  const transporte = obterTransportador();
  if (!transporte) {
    console.log(`[email:simulado] para ${para} | ${assunto}`);
    return { status: 'simulado' };
  }

  try {
    const remetente = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporte.sendMail({
      from: `"${nomeRemetente.replace(/"/g, '')}" <${remetente}>`,
      to: para,
      subject: assunto,
      text: montarTexto(conteudo),
      html: montarHtml(conteudo)
    });
    console.log(`[email:enviado] para ${para} | ${assunto}`);
    return { status: 'enviado' };
  } catch (error) {
    console.error(`[email:falhou] para ${para} | ${assunto}: ${error.message}`);
    return { status: 'falhou', erro: error.message.slice(0, 500) };
  }
}

// Usado no teste de configuração: confirma usuário/senha com o servidor SMTP
async function verificarConexao() {
  const transporte = obterTransportador();
  if (!transporte) return { ok: false, motivo: 'SMTP não configurado no .env do backend' };
  try {
    await transporte.verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, motivo: error.message };
  }
}

module.exports = { enviarEmail, verificarConexao, smtpConfigurado };
