const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
    res.send('Dashboard')
})

router.get('/dashboard/agenda', (req, res) => {
    res.send('Agenda')
})

router.get('/dashboard/clientes', (req, res) => {
    res.send('Clientes')
})

router.get('/dashboard/servicos', (req, res) => {
    res.send('Serviços')
})

router.get('/dashboard/produtos', (req, res) => {
    res.send('Produtos')
})

router.get('/dashboard/financeiro', (req, res) => {
    res.send('Financeiro')
})

router.get('/dashboard/relatorio', (req, res) => {
    res.send('Relatorio')
})

router.get('/dashboard/configuracoes', (req, res) => {
    res.send('Configurações')
})

module.exports = router;