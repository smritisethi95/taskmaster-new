import { Team, TeamMember, User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
import { Sequelize } from 'sequelize';

export const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user.id;

    const team = await Team.create({
      name,
      description,
      createdBy
    });

    await TeamMember.create({
      teamId: team.id,
      userId: createdBy,
      role: 'owner'
    });

    return successResponse(res, team, 'Team created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const memberships = await TeamMember.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Team,
          attributes: {
            include: [
              [
                Sequelize.literal(`(
                  SELECT COUNT(*)
                  FROM "TeamMembers" AS "members"
                  WHERE "members"."teamId" = "Team"."id"
                )`),
                'memberCount'
              ]
            ]
          }
        }
      ]
    });

    const teams = memberships.map(m => m.Team);

    return successResponse(res, teams);
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const isMember = await TeamMember.findOne({
      where: { teamId, userId: req.user.id }
    });

    if (!isMember) {
      throw new AppError('You are not a member of this team', 403);
    }

    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: TeamMember,
          as: 'members', // Assuming association is aliased like this or similar in Model
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ]
        }
      ]
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    return successResponse(res, team);
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;

    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    await team.update({
      name: name !== undefined ? name : team.name,
      description: description !== undefined ? description : team.description
    });

    return successResponse(res, team);
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    await team.destroy();

    return successResponse(res, null, 'Team deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'member' } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const existingMember = await TeamMember.findOne({
      where: { teamId, userId: user.id }
    });

    if (existingMember) {
      throw new AppError('User is already a member of this team', 400);
    }

    const teamMember = await TeamMember.create({
      teamId,
      userId: user.id,
      role
    });

    const team = await Team.findByPk(teamId);

    await createNotification({
      userId: user.id,
      type: 'team_invitation',
      message: `You have been added to team: ${team.name}`,
      metadata: { teamId: team.id }
    });

    return successResponse(res, teamMember, 'Member added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;

    const member = await TeamMember.findOne({
      where: { teamId, userId }
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    if (member.role === 'owner' && req.user.id === userId) {
      throw new AppError('Owner cannot remove themselves', 400);
    }

    await member.destroy();

    return successResponse(res, null, 'Member removed successfully');
  } catch (error) {
    next(error);
  }
};

export const changeMemberRole = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body;

    if (role === 'owner') {
      throw new AppError('Cannot transfer ownership directly via role change', 400);
    }

    if (req.user.id === userId) {
      throw new AppError('Cannot change your own role', 400);
    }

    const member = await TeamMember.findOne({
      where: { teamId, userId }
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    if (member.role === 'owner') {
      throw new AppError('Cannot change role of the owner', 400);
    }

    await member.update({ role });

    return successResponse(res, member, 'Member role updated successfully');
  } catch (error) {
    next(error);
  }
};
