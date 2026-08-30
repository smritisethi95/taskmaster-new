import fs from 'fs/promises';
import { Task, Attachment, User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';

export async function uploadAttachment(req, res, next) {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const attachment = await Attachment.create({
      taskId,
      uploadedBy: userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    return successResponse(res, attachment, 'Attachment uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getAttachments(req, res, next) {
  try {
    const { taskId } = req.params;

    const attachments = await Attachment.findAll({
      where: { taskId },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'email'] }]
    });

    return successResponse(res, attachments, 'Attachments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function downloadAttachment(req, res, next) {
  try {
    const { id, taskId } = req.params;

    const attachment = await Attachment.findOne({ where: { id, taskId } });
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    res.download(attachment.path, attachment.originalName, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttachment(req, res, next) {
  try {
    const { id, taskId } = req.params;
    const userId = req.user.id;

    const attachment = await Attachment.findOne({ where: { id, taskId } });
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    if (attachment.uploadedBy !== userId) {
      throw new AppError('Not authorized to delete this attachment', 403);
    }

    try {
      await fs.unlink(attachment.path);
    } catch (fsError) {
      console.warn('Failed to delete file from filesystem:', fsError);
    }

    await attachment.destroy();

    return successResponse(res, null, 'Attachment deleted successfully');
  } catch (error) {
    next(error);
  }
}
