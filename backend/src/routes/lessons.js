const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { listLessons } = require('../controllers/lessonController');

router.use(protect);

router.get('/', listLessons);

module.exports = router;
