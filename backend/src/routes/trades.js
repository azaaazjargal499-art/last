// smart-inventory/backend/src/routes/trades.js
const router = require('express').Router();
const { getTrades, createTrade, updateTrade, deleteTrade, getTradeById } = require('../controllers/tradeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTrades)
  .post(createTrade);

router.route('/:id')
  .get(getTradeById)
  .put(updateTrade)
  .delete(deleteTrade);

module.exports = router;
