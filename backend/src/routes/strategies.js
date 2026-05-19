// smart-inventory/backend/src/routes/strategies.js
const router = require('express').Router();
const { getStrategies, createStrategy, updateStrategy, deleteStrategy } = require('../controllers/strategyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getStrategies).post(createStrategy);
router.route('/:id').put(updateStrategy).delete(deleteStrategy);

module.exports = router;
