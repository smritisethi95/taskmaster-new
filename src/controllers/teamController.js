import { Team, User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';

export const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user.id;

    const team = await Team.create({
      name,
      description,
      createdBy,
      members: [
        {
          user: createdBy,
          role: 'owner',
          joinedAt: new Date()
        }
      ]
    });

    const populatedTeam = await Team.findById(team.id)
      .populate('createdBy', 'id name email avatar')
      .populate('members.user', 'id name email avatar');

    return successResponse(res, populatedTeam, 'Team created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ 'members.user': req.user.id })
      .populate('createdBy', 'id name email avatar')
      .populate('members.user', 'id name email avatar')
      .sort({ createdAt: -1 });

    return successResponse(res, teams);
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('createdBy', 'id name email avatar')
      .populate('members.user', 'id name email avatar');

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const isMember = team.members.some(
      (m) => m.user && m.user.id ? m.user.id.toString() === req.user.id.toString() : m.user.toString() === req.user.id.toString()
    );

    if (!isMember) {
      throw new AppError('You are not a member of this team', 403);
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

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const team = await Team.findByIdAndUpdate(teamId, updateData, {
      new: true,
      runValidators: true
    })
      .populate('createdBy', 'id name email avatar')
      .populate('members.user', 'id name email avatar');

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    return successResponse(res, team, 'Team updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findByIdAndDelete(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    return successResponse(res, null, 'Team deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'member' } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const isAlreadyMember = team.members.some(
      (m) => m.user.toString() === user.id.toString()
    );

    if (isAlreadyMember) {
      throw new AppError('User is already a member of this team', 400);
    }

    team.members.push({
      user: user.id,
      role,
      joinedAt: new Date()
    });

    await team.save();

    await createNotification({
      userId: user.id,
      type: 'team_invitation',
      message: `You have been added to team: ${team.name}`,
      metadata: { teamId: team.id }
    });

    const updatedTeam = await Team.findById(teamId)
      .populate('createdBy', 'id name email avatar')
      .populate('members.user', 'id name email avatar');

    return successResponse(res, updatedTeam, 'Member added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const memberIndex = team.members.findIndex(
      (m) => m.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      throw new AppError('Member not found in this team', 404);
    }

    const member = team.members[memberIndex];
    if (member.role === 'owner' && req.user.id.toString() === userId.toString()) {
      throw new AppError('Owner cannot remove themselves', 400);
    }

    team.members.splice(memberIndex, 1);
    await team.save();

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

    if (req.user.id.toString() === userId.toString()) {
      throw new AppError('Cannot change your own role', 400);
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const member = team.members.find(
      (m) => m.user.toString() === userId.toString()
    );

    if (!member) {
      throw new AppError('Member not found in this team', 404);
    }

    if (member.role === 'owner') {
      throw new AppError('Cannot change role of the owner', 400);
    }

    member.role = role;
    await team.save();

    return successResponse(res, member, 'Member role updated successfully');
  } catch (error) {
    next(error);
  }
};
