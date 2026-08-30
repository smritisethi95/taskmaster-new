import { Notification } from '../models/index.js';
import { getWebSocketServer } from '../websocket/index.js';

export async function createNotification({ userId, type, message, metadata = {} }) {
  const notification = await Notification.create({
    userId,
    type,
    message,
    metadata,
    isRead: false
  });

  try {
    const wss = getWebSocketServer();
    if (wss && typeof wss.sendToUser === 'function') {
      wss.sendToUser(userId, { type: 'notification', data: notification.toJSON() });
    }
  } catch (error) {
    console.warn('Failed to send real-time notification via WebSocket:', error);
  }

  return notification;
}
