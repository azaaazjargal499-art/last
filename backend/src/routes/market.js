const express = require('express');
const { getQuotes } = require('../controllers/marketController');

const router = express.Router();

router.get('/quotes', getQuotes);

module.exports = router;
