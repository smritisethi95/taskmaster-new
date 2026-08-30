import express from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import * as commentController from '../controllers/commentController.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  [
    param('taskId').isMongoId().withMessage('Valid taskId is required'),
    body('content').notEmpty().withMessage('Content is required').isString()
  ],
  validate,
  commentController.addComment
);

router.get(
  '/',
  [param('taskId').isMongoId().withMessage('Valid taskId is required')],
  validate,
  commentController.getComments
);

router.put(
  '/:id',
  [
    param('taskId').isMongoId().withMessage('Valid taskId is required'),
    param('id').isMongoId().withMessage('Valid commentId is required'),
    body('content').notEmpty().withMessage('Content is required').isString()
  ],
  validate,
  commentController.updateComment
);

router.delete(
  '/:id',
  [
    param('taskId').isMongoId().withMessage('Valid taskId is required'),
    param('id').isMongoId().withMessage('Valid commentId is required')
  ],
  validate,
  commentController.deleteComment
);

export default router;
