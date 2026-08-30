import { Task, Team, User, Comment, Attachment } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination.js';
import { createNotification } from '../services/notificationService.js';

export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, teamId, assigneeId } = req.body;
    const createdBy = req.user.id;

    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }
      const isMember = team.members.some((m) => m.user.toString() === createdBy.toString());
      if (!isMember) {
        throw new AppError('You are not a member of this team', 403);
      }

      if (assigneeId) {
        const isAssigneeMember = team.members.some((m) => m.user.toString() === assigneeId.toString());
        if (!isAssigneeMember) {
          throw new AppError('Assignee is not a member of this team', 400);
        }
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'open',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      teamId: teamId || null,
      assigneeId: assigneeId || null,
      createdBy
    });

    if (assigneeId && assigneeId.toString() !== createdBy.toString()) {
      await createNotification({
        userId: assigneeId,
        type: 'task_assigned',
        message: `You have been assigned to task: ${title}`,
        metadata: { taskId: task.id }
      });
    }

    const createdTask = await Task.findById(task.id)
      .populate('createdBy', 'id name email avatar')
      .populate('assigneeId', 'id name email avatar')
      .populate('teamId', 'id name');

    return successResponse(res, createdTask, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignee, teamId, search, sortBy = 'createdAt', order = 'DESC', page = 1, limit = 10 } = req.query;
    const { offset, limit: limitNum } = getPaginationParams({ page, limit });

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (assignee) {
      filter.assigneeId = assignee === 'me' ? req.user.id : assignee;
    }

    if (teamId) {
      filter.teamId = teamId;
    } else if (!assignee) {
      filter.$or = [
        { createdBy: req.user.id },
        { assigneeId: req.user.id }
      ];
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchCondition = {
        $or: [{ title: searchRegex }, { description: searchRegex }]
      };

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, searchCondition];
        delete filter.$or;
      } else {
        filter.$or = searchCondition.$or;
      }
    }

    const sortOrder = order.toUpperCase() === 'ASC' ? 1 : -1;
    const sortField = sortBy === 'id' ? '_id' : sortBy;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(offset)
        .limit(limitNum)
        .populate('createdBy', 'id name email avatar')
        .populate('assigneeId', 'id name email avatar')
        .populate('teamId', 'id name'),
      Task.countDocuments(filter)
    ]);

    const meta = getPaginationMeta(total, page, limitNum);

    return successResponse(res, { tasks, meta });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('createdBy', 'id name email avatar')
      .populate('assigneeId', 'id name email avatar')
      .populate('teamId', 'id name');

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const [comments, attachments] = await Promise.all([
      Comment.find({ taskId: id }).populate('userId', 'id name email avatar').sort({ createdAt: 1 }),
      Attachment.find({ taskId: id }).populate('uploadedBy', 'id name email avatar')
    ]);

    const taskData = task.toJSON();
    taskData.comments = comments;
    taskData.attachments = attachments;

    return successResponse(res, taskData);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, teamId, assigneeId } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const isCreator = task.createdBy.toString() === req.user.id.toString();
    const isAssignee = task.assigneeId && task.assigneeId.toString() === req.user.id.toString();

    if (!isCreator && !isAssignee) {
      throw new AppError('You are not authorized to update this task', 403);
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (teamId !== undefined) task.teamId = teamId;
    if (assigneeId !== undefined) task.assigneeId = assigneeId;

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('createdBy', 'id name email avatar')
      .populate('assigneeId', 'id name email avatar')
      .populate('teamId', 'id name');

    return successResponse(res, updatedTask);
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const isCreator = task.createdBy.toString() === req.user.id.toString();
    const isAssignee = task.assigneeId && task.assigneeId.toString() === req.user.id.toString();

    if (!isCreator && !isAssignee) {
      throw new AppError('You are not authorized to update this task status', 403);
    }

    task.status = status;
    await task.save();

    const otherUser = isCreator ? task.assigneeId : task.createdBy;
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

    const task = await Task.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.createdBy.toString() !== req.user.id.toString()) {
      throw new AppError('Only the creator can assign this task', 403);
    }

    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      throw new AppError('Assignee not found', 404);
    }

    if (task.teamId) {
      const team = await Team.findById(task.teamId);
      const isMember = team && team.members.some((m) => m.user.toString() === assigneeId.toString());
      if (!isMember) {
        throw new AppError('Assignee is not a member of the team', 400);
      }
    }

    task.assigneeId = assigneeId;
    await task.save();

    if (assigneeId.toString() !== req.user.id.toString()) {
      await createNotification({
        userId: assigneeId,
        type: 'task_assigned',
        message: `You have been assigned to task: ${task.title}`,
        metadata: { taskId: task.id }
      });
    }

    const updatedTask = await Task.findById(id)
      .populate('createdBy', 'id name email avatar')
      .populate('assigneeId', 'id name email avatar');

    return successResponse(res, updatedTask);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.createdBy.toString() !== req.user.id.toString()) {
      throw new AppError('Only the creator can delete this task', 403);
    }

    await Promise.all([
      Task.findByIdAndDelete(id),
      Comment.deleteMany({ taskId: id }),
      Attachment.deleteMany({ taskId: id })
    ]);

    return successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};
