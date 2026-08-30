import { Notification } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination.js';

export async function getNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { offset, limit: limitNum } = getPaginationParams({ page, limit });

    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limitNum),
      Notification.countDocuments({ userId: req.user.id })
    ]);

    const meta = getPaginationMeta(total, page, limitNum);

    return successResponse(res, { notifications, meta }, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId.toString() !== req.user.id.toString()) {
      throw new AppError('You are not authorized to update this notification', 403);
    }

    notification.isRead = true;
    await notification.save();

    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    return successResponse(res, { count: result.modifiedCount }, 'Notifications marked as read');
  } catch (error) {
    next(error);
  }
}
