// smart-inventory/backend/src/routes/risk.js
const router = require('express').Router();
const { calculateRisk, getExposure } = require('../controllers/riskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/calculate', calculateRisk);
router.get('/exposure', getExposure);

module.exports = router;
