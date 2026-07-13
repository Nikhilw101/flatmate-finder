const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { z } = require('zod');

// Schema for updating own profile
const updateMeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional()
});

// All user routes require authentication
router.use(protect);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateMeSchema), userController.updateMe);

module.exports = router;
