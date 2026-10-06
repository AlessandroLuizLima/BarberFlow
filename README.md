# BarberFlow — Sistema de Agendamento para Barbearias

Sistema web que substitui o agendamento manual por mensagens: o cliente
escolhe serviço, profissional, data e horário; o sistema confirma na hora,
lembra o cliente 2h antes e avisa a lista de espera quando um horário vaga.

## Estrutura do projeto

```
BarberFlow/
├── barbearia-backend/     API REST (Node.js + Express + Sequelize + PostgreSQL)
└── barbearia-frontend/    Interface web (React + Vite)
```

## Como rodar localmente

### Pré-requisitos
- Node.js 18+ instalado
- PostgreSQL instalado e rodando

### 1. Banco de dados
Crie um banco vazio chamado `Barbearia_Cortae_DB` (via pgAdmin ou `psql`).
As tabelas são criadas automaticamente ao subir o backend — não é
necessário rodar nenhum script SQL manualmente, mas se quiser ver o
schema pronto para consulta/documentação, use `barbearia-backend/database/schema.sql`
no Query Tool do pgAdmin.

### 2. Backend
```bash
cd barbearia-backend
npm install
cp .env.example .env
# edite o .env se sua senha/usuário do Postgres for diferente de "postgres"
npm run seed   # popula serviços e profissionais de exemplo (opcional, mas recomendado)
npm run dev
```
O servidor sobe em `http://localhost:3000`. No console você deve ver:
```
Conexão com o banco de dados estabelecida com sucesso.
Modelos sincronizados com o banco de dados.
Job de lembretes (2h antes) iniciado.
Servidor rodando na porta 3000
```

### 3. Frontend
Em outro terminal:
```bash
cd barbearia-frontend
npm install
cp .env.example .env
npm run dev
```
Acesse `http://localhost:5173`.

### 4. Testando o fluxo do cliente
1. Vá em "Cadastro" na tela de login do cliente (`/auth/cliente`) e crie uma conta.
2. Faça login.
3. Em "Agendamentos", escolha serviço → profissional → data/horário → confirme.
4. Na Home, veja o agendamento criado (e pode cancelar).
5. No terminal do backend, você verá os logs `[MENSAGEM:confirmacao]`,
   `[MENSAGEM:lembrete]` (quando faltarem ≤2h) e `[MENSAGEM:lista_espera]`
   simulando o envio das notificações — elas também ficam salvas na tabela
   `mensagens`, consultável em `GET /mensagens`.

## Onde cada requisito da atividade foi atendido

| Requisito pedido | Onde está implementado |
|---|---|
| Agendamento por serviço e profissional | `POST /agendamentos` (`src/controllers/agendamentosController.js`), tela `ClientBooking.jsx` |
| Confirmação imediata | `notificacaoService.enviarConfirmacao`, chamado ao criar o agendamento |
| Lembrete 2h antes | `src/jobs/lembreteJob.js` — roda a cada minuto via `node-cron`, verifica agendamentos na janela de 2h e envia o lembrete uma única vez |
| Aviso à lista de espera quando um horário vaga | `agendamentosController.cancelarAgendamento` — ao cancelar, busca o próximo da fila (`ListaEspera`) e notifica |
| Entidade `clientes` | `src/models/Cliente.js` |
| Entidade `profissionais` | `src/models/Profissional.js` |
| Entidade `servicos` | `src/models/Servico.js` |
| Entidade `agendamentos` | `src/models/Agendamento.js` |
| Entidade `lista_espera` | `src/models/ListaEspera.js` |
| Entidade `mensagens` | `src/models/Mensagem.js` — histórico de toda notificação "enviada" |
| Segunda API — ViaCEP | `src/services/viaCepService.js`, usado em `clientesController` (cadastro/edição do cliente) e exposto em `GET /cep/:cep` para o frontend consultar em tempo real |

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/clientes` | Cadastra cliente (endereço completado via ViaCEP se enviar `cep`) |
| POST | `/clientes/login` | Login do cliente |
| GET/PUT/DELETE | `/clientes/:id` | CRUD de cliente |
| GET | `/cep/:cep` | Consulta avulsa de endereço por CEP |
| POST/GET/PUT/DELETE | `/profissionais` | CRUD de profissionais |
| POST/GET/PUT/DELETE | `/servicos` | CRUD de serviços |
| POST | `/agendamentos` | Cria agendamento (verifica conflito de horário) |
| GET | `/agendamentos?cliente_id=&profissional_id=&status=` | Lista agendamentos |
| PUT | `/agendamentos/:id` | Reagenda |
| DELETE | `/agendamentos/:id` | Cancela e avisa a lista de espera |
| POST | `/lista-espera` | Cliente entra na lista de espera |
| GET | `/lista-espera` | Lista entradas da fila |
| DELETE | `/lista-espera/:id` | Sai da lista de espera |
| GET | `/mensagens?cliente_id=&tipo=` | Histórico de notificações enviadas |

## O que está fora do escopo desta entrega

O projeto original (`BarberFlow`) tinha uma visão mais ampla, incluindo um
painel completo do barbeiro (produtos, financeiro, relatórios). Como a
atividade proposta é focada no fluxo do **cliente agendando com uma
barbearia**, o painel do barbeiro (`/dashboard/*`) permanece com dados
simulados — não faz parte dos 6 requisitos pedidos. O login do barbeiro
também continua simulado pelo mesmo motivo.

## Solução de problemas comuns

- **"Não foi possível conectar ao banco de dados"**: confira se o
  PostgreSQL está rodando e se as credenciais no `.env` do backend
  batem com as do seu Postgres local.
- **Tela de agendamento aparece vazia**: rode `npm run seed` no backend
  para criar serviços e profissionais de exemplo.
- **Erro de CORS no navegador**: confirme que o backend está rodando
  em `http://localhost:3000` (ou ajuste `VITE_API_URL` no `.env` do
  frontend para apontar para onde o backend está rodando).
- **CEP não preenche o endereço**: a consulta à API ViaCEP precisa de
  internet livre — não funciona atrás de proxies/firewalls que bloqueiam
  `viacep.com.br`.
