const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { upsertProfileSchema } = require('../validators/profile.validator');

// All profile routes require the user to be logged in and strictly be a TENANT
router.use(protect, authorize('TENANT'));

router.get('/', profileController.getProfile);
router.put('/', validate(upsertProfileSchema), profileController.upsertProfile);

module.exports = router;
