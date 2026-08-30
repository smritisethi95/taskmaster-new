import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/database.js';
import { initWebSocket } from './src/websocket/index.js';

const server = createServer(app);

// Initialize WebSocket server
initWebSocket(server);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 TaskMaster server running on port ${PORT}`);
      console.log(`📡 WebSocket server available at ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('❌ Unable to start the server:', error);
    process.exit(1);
  }
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
