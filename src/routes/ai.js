import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/generate-description',
  [
    body('input')
      .notEmpty().withMessage('Input is required')
      .isString()
      .isLength({ min: 3 }).withMessage('Input must be at least 3 characters')
  ],
  validate,
  aiController.generateDescription
);

router.post(
  '/summarize-task',
  [
    body('taskId').notEmpty().withMessage('Task ID is required').isUUID()
  ],
  validate,
  aiController.summarizeTask
);

export default router;
