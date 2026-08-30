import express from 'express';
import { param } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', [param('id').isMongoId().withMessage('Valid notification ID is required')], validate, notificationController.markAsRead);

export default router;
