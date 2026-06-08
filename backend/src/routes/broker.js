const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  connectBroker,
  createEaToken,
  disconnectBroker,
  getActiveConnection,
  syncBroker,
} = require('../controllers/brokerController');

router.use(protect);

router.get('/status', getActiveConnection);
router.post('/connect', connectBroker);
router.post('/sync', syncBroker);
router.post('/ea-token', createEaToken);
router.post('/disconnect', disconnectBroker);

module.exports = router;
