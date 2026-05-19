// smart-inventory/backend/src/routes/alerts.js
const router = require('express').Router();
const { getAlerts, createAlert, updateAlert, deleteAlert, checkAlerts } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getAlerts).post(createAlert);
router.route('/:id').put(updateAlert).delete(deleteAlert);
router.post('/check', checkAlerts);

module.exports = router;
