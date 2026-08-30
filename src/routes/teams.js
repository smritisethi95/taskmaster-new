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

router.get('/:teamId', [param('teamId').isUUID()], validate, teamController.getTeamById);

router.put(
  '/:teamId',
  authorizeTeamRole('owner', 'admin'),
  [
    param('teamId').isUUID(),
    body('name').optional().isString(),
    body('description').optional().isString()
  ],
  validate,
  teamController.updateTeam
);

router.delete(
  '/:teamId',
  authorizeTeamRole('owner'),
  [param('teamId').isUUID()],
  validate,
  teamController.deleteTeam
);

router.post(
  '/:teamId/members',
  authorizeTeamRole('owner', 'admin'),
  [
    param('teamId').isUUID(),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['admin', 'member'])
  ],
  validate,
  teamController.addMember
);

router.delete(
  '/:teamId/members/:userId',
  authorizeTeamRole('owner', 'admin'),
  [
    param('teamId').isUUID(),
    param('userId').isUUID()
  ],
  validate,
  teamController.removeMember
);

router.patch(
  '/:teamId/members/:userId/role',
  authorizeTeamRole('owner'),
  [
    param('teamId').isUUID(),
    param('userId').isUUID(),
    body('role').notEmpty().isIn(['admin', 'member'])
  ],
  validate,
  teamController.changeMemberRole
);

export default router;
