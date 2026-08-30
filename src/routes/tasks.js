import express from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import * as taskController from '../controllers/taskController.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional().isString(),
    body('status').optional().isIn(['open', 'in_progress', 'completed', 'archived']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isISO8601().toDate(),
    body('teamId').optional().isMongoId().withMessage('Valid teamId is required'),
    body('assigneeId').optional().isMongoId().withMessage('Valid assigneeId is required')
  ],
  validate,
  taskController.createTask
);

router.get('/', taskController.getTasks);

router.get('/:id', [param('id').isMongoId().withMessage('Valid task ID is required')], validate, taskController.getTaskById);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Valid task ID is required'),
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('status').optional().isIn(['open', 'in_progress', 'completed', 'archived']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isISO8601().toDate(),
    body('teamId').optional().isMongoId(),
    body('assigneeId').optional().isMongoId()
  ],
  validate,
  taskController.updateTask
);

router.patch(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Valid task ID is required'),
    body('status').notEmpty().isIn(['open', 'in_progress', 'completed', 'archived'])
  ],
  validate,
  taskController.updateTaskStatus
);

router.patch(
  '/:id/assign',
  [
    param('id').isMongoId().withMessage('Valid task ID is required'),
    body('assigneeId').notEmpty().isMongoId().withMessage('Valid assigneeId is required')
  ],
  validate,
  taskController.assignTask
);

router.delete('/:id', [param('id').isMongoId().withMessage('Valid task ID is required')], validate, taskController.deleteTask);

export default router;
