const router = require('express').Router();
const { receiveEaTrade } = require('../controllers/brokerController');

router.post('/trade', receiveEaTrade);

module.exports = router;
