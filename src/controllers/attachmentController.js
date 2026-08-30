import fs from 'fs/promises';
import { Task, Attachment } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';

export async function uploadAttachment(req, res, next) {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const attachment = await Attachment.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      taskId,
      uploadedBy: req.user.id
    });

    const populated = await Attachment.findById(attachment.id).populate('uploadedBy', 'id name email avatar');

    return successResponse(res, populated, 'Attachment uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getAttachments(req, res, next) {
  try {
    const { taskId } = req.params;

    const attachments = await Attachment.find({ taskId })
      .populate('uploadedBy', 'id name email avatar')
      .sort({ createdAt: -1 });

    return successResponse(res, attachments, 'Attachments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function downloadAttachment(req, res, next) {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findById(id);
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    return res.download(attachment.path, attachment.originalName);
  } catch (error) {
    next(error);
  }
}

export async function deleteAttachment(req, res, next) {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findById(id);
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    if (attachment.uploadedBy.toString() !== req.user.id.toString()) {
      throw new AppError('You are not authorized to delete this attachment', 403);
    }

    try {
      await fs.unlink(attachment.path);
    } catch (err) {
      console.warn('Could not delete file from disk:', err.message);
    }

    await Attachment.findByIdAndDelete(id);

    return successResponse(res, null, 'Attachment deleted successfully');
  } catch (error) {
    next(error);
  }
}
