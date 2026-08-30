import { Task, Comment } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import * as aiService from '../services/aiService.js';

export async function generateDescription(req, res, next) {
  try {
    const { input } = req.body;

    const description = await aiService.generateTaskDescription(input);

    return successResponse(res, { description }, 'Description generated successfully');
  } catch (error) {
    next(error);
  }
}

export async function summarizeTask(req, res, next) {
  try {
    const { taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const comments = await Comment.find({ taskId }).sort({ createdAt: 1 });

    const summary = await aiService.summarizeTask(task, comments);

    return successResponse(res, { summary }, 'Task summarized successfully');
  } catch (error) {
    next(error);
  }
}
