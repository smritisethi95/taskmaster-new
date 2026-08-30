import { Task, Comment, User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination.js';
import { createNotification } from '../services/notificationService.js';

export async function addComment(req, res, next) {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const comment = await Comment.create({
      taskId,
      userId,
      content
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    if (task.createdBy && task.createdBy !== userId) {
      await createNotification({
        userId: task.createdBy,
        type: 'new_comment',
        message: `New comment on task: ${task.title}`,
        metadata: { taskId, commentId: comment.id }
      });
    }

    if (task.assigneeId && task.assigneeId !== userId && task.assigneeId !== task.createdBy) {
      await createNotification({
        userId: task.assigneeId,
        type: 'new_comment',
        message: `New comment on task: ${task.title}`,
        metadata: { taskId, commentId: comment.id }
      });
    }

    return successResponse(res, commentWithUser, 'Comment added successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getComments(req, res, next) {
  try {
    const { taskId } = req.params;
    const { limit, offset } = getPaginationParams(req.query);

    const { rows: comments, count } = await Comment.findAndCountAll({
      where: { taskId },
      include: [{ model: User, attributes: ['id', 'name', 'email', 'avatar'] }],
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });

    const meta = getPaginationMeta(count, req.query.page, limit);

    return successResponse(res, { comments, meta }, 'Comments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateComment(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Not authorized to edit this comment', 403);
    }

    comment.content = content;
    await comment.save();

    return successResponse(res, comment, 'Comment updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    await comment.destroy();

    return successResponse(res, null, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
}
