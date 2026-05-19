const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { overview, listUsers, updateUser } = require('../controllers/adminController');

router.use(protect, requireAdmin);

router.get('/overview', overview);
router.get('/users', listUsers);
router.patch('/users/:id', updateUser);

module.exports = router;
