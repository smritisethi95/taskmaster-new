import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import * as commentController from '../controllers/commentController.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  [
    body('content').notEmpty().withMessage('Content is required').isString()
  ],
  validate,
  commentController.addComment
);

router.get('/', commentController.getComments);

router.put(
  '/:id',
  [
    body('content').notEmpty().withMessage('Content is required').isString()
  ],
  validate,
  commentController.updateComment
);

router.delete('/:id', commentController.deleteComment);

export default router;
