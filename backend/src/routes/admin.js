const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { overview, listUsers, updateUser } = require('../controllers/adminController');
const lessonController = require('../controllers/lessonController');

router.use(protect, requireAdmin);

router.get('/overview', overview);
router.get('/users', listUsers);
router.patch('/users/:id', updateUser);

router.get('/lessons', lessonController.adminListLessons);
router.post('/lessons', lessonController.createLesson);
router.put('/lessons/:id', lessonController.updateLesson);
router.delete('/lessons/:id', lessonController.deleteLesson);

module.exports = router;
