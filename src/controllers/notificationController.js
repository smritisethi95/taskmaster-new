import { Notification } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination.js';

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { limit, offset } = getPaginationParams(req.query);

    const { rows: notifications, count } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const meta = getPaginationMeta(count, req.query.page, limit);

    return successResponse(res, { notifications, meta }, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Not authorized', 403);
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
    const userId = req.user.id;

    const [updatedCount] = await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    return successResponse(res, { count: updatedCount }, 'Notifications marked as read');
  } catch (error) {
    next(error);
  }
}
