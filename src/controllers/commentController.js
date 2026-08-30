import { Task, Comment } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination.js';
import { createNotification } from '../services/notificationService.js';

export async function addComment(req, res, next) {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const comment = await Comment.create({
      content,
      taskId,
      userId: req.user.id
    });

    // Notify task creator and assignee if different from commenter
    const recipientIds = new Set();
    if (task.createdBy && task.createdBy.toString() !== req.user.id.toString()) {
      recipientIds.add(task.createdBy.toString());
    }
    if (task.assigneeId && task.assigneeId.toString() !== req.user.id.toString()) {
      recipientIds.add(task.assigneeId.toString());
    }

    for (const recipientId of recipientIds) {
      await createNotification({
        userId: recipientId,
        type: 'comment_added',
        message: `New comment on task "${task.title}": ${content.substring(0, 50)}...`,
        metadata: { taskId: task.id, commentId: comment.id }
      });
    }

    const populatedComment = await Comment.findById(comment.id).populate('userId', 'id name email avatar');

    return successResponse(res, populatedComment, 'Comment added successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getComments(req, res, next) {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: limitNum } = getPaginationParams({ page, limit });

    const [comments, total] = await Promise.all([
      Comment.find({ taskId })
        .populate('userId', 'id name email avatar')
        .sort({ createdAt: 1 })
        .skip(offset)
        .limit(limitNum),
      Comment.countDocuments({ taskId })
    ]);

    const meta = getPaginationMeta(total, page, limitNum);

    return successResponse(res, { comments, meta }, 'Comments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateComment(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId.toString() !== req.user.id.toString()) {
      throw new AppError('You are not authorized to update this comment', 403);
    }

    comment.content = content;
    await comment.save();

    const populated = await Comment.findById(id).populate('userId', 'id name email avatar');

    return successResponse(res, populated, 'Comment updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId.toString() !== req.user.id.toString()) {
      throw new AppError('You are not authorized to delete this comment', 403);
    }

    await Comment.findByIdAndDelete(id);

    return successResponse(res, null, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
}
