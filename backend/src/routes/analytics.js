// smart-inventory/backend/src/routes/analytics.js
const router = require('express').Router();
const { getDashboard, getMonthlyPnL, getPairPerformance, getHourlyPerformance, getEquityCurve, getDrawdown, getStreaks } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/monthly', getMonthlyPnL);
router.get('/pairs', getPairPerformance);
router.get('/hourly', getHourlyPerformance);
router.get('/equity-curve', getEquityCurve);
router.get('/drawdown', getDrawdown);
router.get('/streaks', getStreaks);

module.exports = router;
