import { Op } from 'sequelize';
import { Task, User, TeamMember, Comment, Attachment } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination.js';
import { createNotification } from '../services/notificationService.js';

export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, teamId, assigneeId } = req.body;
    const createdBy = req.user.id;

    if (teamId) {
      const isMember = await TeamMember.findOne({ where: { teamId, userId: createdBy } });
      if (!isMember) {
        throw new AppError('You are not a member of this team', 403);
      }
    }

    if (assigneeId && teamId) {
      const isAssigneeMember = await TeamMember.findOne({ where: { teamId, userId: assigneeId } });
      if (!isAssigneeMember) {
        throw new AppError('Assignee is not a member of this team', 400);
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      teamId,
      assigneeId,
      createdBy
    });

    if (assigneeId && assigneeId !== createdBy) {
      await createNotification({
        userId: assigneeId,
        type: 'task_assigned',
        message: `You have been assigned to task: ${title}`,
        metadata: { taskId: task.id }
      });
    }

    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    return successResponse(res, createdTask, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignee, teamId, search, sortBy = 'createdAt', order = 'DESC', page = 1, limit = 10 } = req.query;
    const { offset, limit: limitNum } = getPaginationParams({ page, limit });

    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    
    if (assignee) {
      where.assigneeId = assignee === 'me' ? req.user.id : assignee;
    }

    if (teamId) {
      where.teamId = teamId;
    } else {
      where[Op.or] = [
        { createdBy: req.user.id },
        { assigneeId: req.user.id }
      ];
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Task.findAndCountAll({
      where,
      order: [[sortBy, order.toUpperCase()]],
      limit: limitNum,
      offset,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    const meta = getPaginationMeta(count, page, limitNum);

    return successResponse(res, { tasks: rows, meta });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { 
          model: Comment, 
          include: [{ model: User, attributes: ['id', 'name', 'email'] }] 
        },
        { model: Attachment }
      ]
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return successResponse(res, task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, teamId, assigneeId } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.createdBy !== req.user.id && task.assigneeId !== req.user.id) {
      throw new AppError('You are not authorized to update this task', 403);
    }

    await task.update({
      title: title !== undefined ? title : task.title,
      description: description !== undefined ? description : task.description,
      status: status !== undefined ? status : task.status,
      priority: priority !== undefined ? priority : task.priority,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      teamId: teamId !== undefined ? teamId : task.teamId,
      assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId
    });

    const updatedTask = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    return successResponse(res, updatedTask);
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.createdBy !== req.user.id && task.assigneeId !== req.user.id) {
      throw new AppError('You are not authorized to update this task status', 403);
    }

    await task.update({ status });

    const otherUser = req.user.id === task.createdBy ? task.assigneeId : task.createdBy;
    if (otherUser) {
      await createNotification({
        userId: otherUser,
        type: 'task_status_updated',
        message: `Task status updated to ${status}: ${task.title}`,
        metadata: { taskId: task.id }
      });
    }

    return successResponse(res, task);
  } catch (error) {
    next(error);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.createdBy !== req.user.id) {
      throw new AppError('Only the creator can assign this task', 403);
    }

    const assignee = await User.findByPk(assigneeId);
    if (!assignee) {
      throw new AppError('Assignee not found', 404);
    }

    if (task.teamId) {
      const isMember = await TeamMember.findOne({ where: { teamId: task.teamId, userId: assigneeId } });
      if (!isMember) {
        throw new AppError('Assignee is not a member of the team', 400);
      }
    }

    await task.update({ assigneeId });

    if (assigneeId !== req.user.id) {
      await createNotification({
        userId: assigneeId,
        type: 'task_assigned',
        message: `You have been assigned to task: ${task.title}`,
        metadata: { taskId: task.id }
      });
    }

    const updatedTask = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    return successResponse(res, updatedTask);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.createdBy !== req.user.id) {
      throw new AppError('Only the creator can delete this task', 403);
    }

    await task.destroy();

    return successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};
