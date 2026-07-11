const express = require('express');
const { getRates } = require('../controllers/currencyController');

const router = express.Router();

router.get('/rates', getRates);

module.exports = router;
