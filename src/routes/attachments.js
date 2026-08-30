import express from 'express';
import { param } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import upload from '../middlewares/upload.js';
import * as attachmentController from '../controllers/attachmentController.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  [param('taskId').isMongoId().withMessage('Valid taskId is required')],
  validate,
  upload.single('file'),
  attachmentController.uploadAttachment
);

router.get(
  '/',
  [param('taskId').isMongoId().withMessage('Valid taskId is required')],
  validate,
  attachmentController.getAttachments
);

router.get(
  '/:id/download',
  [
    param('taskId').isMongoId().withMessage('Valid taskId is required'),
    param('id').isMongoId().withMessage('Valid attachmentId is required')
  ],
  validate,
  attachmentController.downloadAttachment
);

router.delete(
  '/:id',
  [
    param('taskId').isMongoId().withMessage('Valid taskId is required'),
    param('id').isMongoId().withMessage('Valid attachmentId is required')
  ],
  validate,
  attachmentController.deleteAttachment
);

export default router;
