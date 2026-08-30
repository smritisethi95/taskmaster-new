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
    body('dueDate').optional().isDate(),
    body('teamId').optional().isUUID(),
    body('assigneeId').optional().isUUID()
  ],
  validate,
  taskController.createTask
);

router.get('/', taskController.getTasks);

router.get('/:id', [param('id').isUUID()], validate, taskController.getTaskById);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('status').optional().isIn(['open', 'in_progress', 'completed', 'archived']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isDate(),
    body('teamId').optional().isUUID(),
    body('assigneeId').optional().isUUID()
  ],
  validate,
  taskController.updateTask
);

router.patch(
  '/:id/status',
  [
    param('id').isUUID(),
    body('status').notEmpty().isIn(['open', 'in_progress', 'completed', 'archived'])
  ],
  validate,
  taskController.updateTaskStatus
);

router.patch(
  '/:id/assign',
  [
    param('id').isUUID(),
    body('assigneeId').notEmpty().isUUID()
  ],
  validate,
  taskController.assignTask
);

router.delete('/:id', [param('id').isUUID()], validate, taskController.deleteTask);

export default router;
