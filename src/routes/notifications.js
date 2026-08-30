import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

export default router;
