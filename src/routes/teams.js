import express from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorizeTeamRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import * as teamController from '../controllers/teamController.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional().isString()
  ],
  validate,
  teamController.createTeam
);

router.get('/', teamController.getTeams);

router.get('/:teamId', [param('teamId').isMongoId().withMessage('Valid teamId is required')], validate, teamController.getTeamById);

router.put(
  '/:teamId',
  [
    param('teamId').isMongoId().withMessage('Valid teamId is required'),
    body('name').optional().isString(),
    body('description').optional().isString()
  ],
  validate,
  authorizeTeamRole('owner', 'admin'),
  teamController.updateTeam
);

router.delete(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Valid teamId is required')],
  validate,
  authorizeTeamRole('owner'),
  teamController.deleteTeam
);

router.post(
  '/:teamId/members',
  [
    param('teamId').isMongoId().withMessage('Valid teamId is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['admin', 'member'])
  ],
  validate,
  authorizeTeamRole('owner', 'admin'),
  teamController.addMember
);

router.delete(
  '/:teamId/members/:userId',
  [
    param('teamId').isMongoId().withMessage('Valid teamId is required'),
    param('userId').isMongoId().withMessage('Valid userId is required')
  ],
  validate,
  authorizeTeamRole('owner', 'admin'),
  teamController.removeMember
);

router.patch(
  '/:teamId/members/:userId/role',
  [
    param('teamId').isMongoId().withMessage('Valid teamId is required'),
    param('userId').isMongoId().withMessage('Valid userId is required'),
    body('role').notEmpty().isIn(['admin', 'member'])
  ],
  validate,
  authorizeTeamRole('owner'),
  teamController.changeMemberRole
);

export default router;
