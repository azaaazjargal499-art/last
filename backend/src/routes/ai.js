// smart-inventory/backend/src/routes/ai.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// ─── Subscription Routes ────────────────────────────────────────────
router.get('/subscription', auth.protect, aiController.getSubscription);
router.post('/subscription', auth.protect, aiController.createSubscription);

// ─── Analysis Routes ────────────────────────────────────────────────
router.post('/analyze-trades', auth.protect, aiController.analyzeTrades);
router.post('/analyze-chart', auth.protect, aiController.analyzeChart);
router.post('/chat', auth.protect, aiController.chat);
router.get('/analyses', auth.protect, aiController.getAnalyses);

module.exports = router;
