import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';

let wss = null;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map(); // userId -> Set<WebSocket>

  wss.on('connection', (ws) => {
    let isAuthenticated = false;
    let currentUserId = null;

    const authTimeout = setTimeout(() => {
      if (!isAuthenticated) {
        ws.close(1008, 'Authentication timeout');
      }
    }, 30000);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        if (!isAuthenticated) {
          if (data.type === 'auth' && data.token) {
            jwt.verify(data.token, authConfig.jwtSecret, (err, decoded) => {
              if (err) {
                ws.close(1008, 'Invalid token');
                return;
              }
              isAuthenticated = true;
              currentUserId = decoded.id;
              clearTimeout(authTimeout);

              if (!clients.has(currentUserId)) {
                clients.set(currentUserId, new Set());
              }
              clients.get(currentUserId).add(ws);

              ws.send(JSON.stringify({ type: 'auth_success', message: 'Authenticated' }));
            });
          } else {
            ws.close(1008, 'Authentication required');
          }
          return;
        }

        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });

    ws.on('close', () => {
      if (currentUserId && clients.has(currentUserId)) {
        clients.get(currentUserId).delete(ws);
        if (clients.get(currentUserId).size === 0) {
          clients.delete(currentUserId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      if (currentUserId && clients.has(currentUserId)) {
        clients.get(currentUserId).delete(ws);
        if (clients.get(currentUserId).size === 0) {
          clients.delete(currentUserId);
        }
      }
    });
    
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
  });

  wss.sendToUser = function(userId, data) {
    if (clients.has(userId)) {
      const userSockets = clients.get(userId);
      const payload = JSON.stringify(data);
      for (const ws of userSockets) {
        if (ws.readyState === 1) { // OPEN
          ws.send(payload);
        }
      }
    }
  };

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

export function getWebSocketServer() {
  return wss;
}
