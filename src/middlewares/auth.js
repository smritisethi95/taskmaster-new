import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';
import { User, TeamMember } from '../models/index.js';
import AppError from '../utils/AppError.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, authConfig.jwtSecret);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user.toSafeJSON();
    next();
  } catch (error) {
    next(error);
  }
}

export function authorizeTeamRole(...roles) {
  return async (req, res, next) => {
    try {
      const teamId = req.params.teamId || req.body.teamId;
      if (!teamId) {
        throw new AppError('Team ID is required', 400);
      }

      const member = await TeamMember.findOne({
        where: { teamId, userId: req.user.id }
      });

      if (!member) {
        throw new AppError('Not a member of this team', 403);
      }

      if (roles.length && !roles.includes(member.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      req.teamMember = member;
      next();
    } catch (error) {
      next(error);
    }
  };
}
