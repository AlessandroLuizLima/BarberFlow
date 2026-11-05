// Perguntas no terminal (com opção de esconder o que é digitado, para senhas).
// As linhas digitadas (ou coladas/enviadas de uma vez) entram numa fila, então nenhuma se perde.
const readline = require('readline');

let rl = null;
let ocultar = false;
const fila = [];
const esperando = [];
let encerrado = false;

function iniciar() {
  if (rl) return;
  rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
  // Enquanto ocultar = true, o que a pessoa digita aparece como "*"
  rl._writeToOutput = (s) => {
    if (!ocultar) return rl.output.write(s);
    if (s === '\r\n' || s === '\n') return rl.output.write(s);
    return rl.output.write('*'.repeat(s.length));
  };
  rl.on('line', (linha) => {
    if (esperando.length) esperando.shift()(linha);
    else fila.push(linha);
  });
  rl.on('close', () => {
    encerrado = true;
    while (esperando.length) esperando.shift()(null);
  });
}

function perguntar(texto, { oculto = false } = {}) {
  iniciar();
  process.stdout.write(texto);
  ocultar = oculto && Boolean(process.stdin.isTTY);
  return new Promise((resolve, reject) => {
    const responder = (linha) => {
      ocultar = false;
      if (linha === null) return reject(new Error('Entrada encerrada antes da resposta.'));
      if (!process.stdin.isTTY) process.stdout.write(oculto ? '***\n' : `${linha}\n`);
      resolve(linha.trim());
    };
    if (fila.length) responder(fila.shift());
    else if (encerrado) responder(null);
    else esperando.push(responder);
  });
}

function fecharTerminal() {
  if (rl) rl.close();
  rl = null;
}

module.exports = { perguntar, fecharTerminal };
