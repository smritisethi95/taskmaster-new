# TaskMaster — Collaborative Task Tracking System

A full-featured backend API for task tracking and team collaboration, built with **Node.js**, **Express.js**, and **MongoDB Atlas** (using **Mongoose ODM**). Features include JWT authentication, real-time WebSocket notifications, file attachments, and optional AI-powered task generation via Google Gemini.

## Features

- **User Authentication** — Register, login, logout with JWT tokens and secure password hashing (bcryptjs)
- **Task Management** — Full CRUD with filtering, sorting, regex keyword search, and pagination
- **Team Collaboration** — Create teams, invite members, role-based access control (owner/admin/member)
- **Comments** — Threaded comments on tasks with real-time notifications
- **File Attachments** — Upload, download, and manage file attachments on tasks
- **Real-time Notifications** — WebSocket-based push notifications for task assignments, status changes, and comments
- **AI Integration** — Generate task descriptions and summaries using Google Gemini (optional)
- **Database** — MongoDB Atlas cloud database with Mongoose schemas and embedded subdocuments

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose v8 |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| Real-time | WebSocket (ws) |
| File Upload | Multer |
| AI | Google Generative AI (Gemini) |
| Validation | express-validator |
| Testing | Built-in E2E Verification Suite |

## Project Structure

```
taskmaster/
├── server.js                  # Entry point (HTTP + WebSocket)
├── public/
│   └── index.html             # Interactive Browser Dashboard & WebSocket Live Tester
├── src/
│   ├── app.js                 # Express app configuration
│   ├── config/
│   │   ├── auth.js            # JWT configuration
│   │   └── database.js        # Mongoose / MongoDB Atlas connection
│   ├── controllers/
│   │   ├── aiController.js    # AI generation endpoints
│   │   ├── attachmentController.js
│   │   ├── authController.js  # Authentication logic
│   │   ├── commentController.js
│   │   ├── notificationController.js
│   │   ├── taskController.js  # Task CRUD + filtering + search
│   │   └── teamController.js  # Team management
│   ├── middlewares/
│   │   ├── auth.js            # JWT auth + team role authorization
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── upload.js          # Multer file upload config
│   │   └── validate.js        # Express-validator runner
│   ├── models/
│   │   ├── index.js           # Model exports
│   │   ├── User.js
│   │   ├── Team.js
│   │   ├── Task.js
│   │   ├── Comment.js
│   │   ├── Attachment.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── ai.js
│   │   ├── attachments.js
│   │   ├── auth.js
│   │   ├── comments.js
│   │   ├── notifications.js
│   │   ├── tasks.js
│   │   └── teams.js
│   ├── services/
│   │   ├── aiService.js       # Gemini AI integration
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── AppError.js        # Custom error class
│   │   ├── apiResponse.js     # Standardized responses
│   │   └── pagination.js      # Pagination helpers
│   └── websocket/
│       └── index.js           # WebSocket server
├── uploads/                   # File attachment storage
├── scripts/
│   └── test-api.js            # Automated E2E verification suite
├── postman_collection.json    # Exportable Postman collection
├── .env.example               # Environment variables template
├── .gitignore
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB Atlas** account (free tier M0 cluster) or local MongoDB

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/taskmaster.git
   cd taskmaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your **MongoDB Atlas Connection URI**:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskmaster?retryWrites=true&w=majority
   JWT_SECRET=your-secure-random-secret
   PORT=3000
   ```

   *(Note: If `MONGODB_URI` is left blank, an in-memory MongoDB instance is automatically started for zero-setup local testing).*

4. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Or standard start
   npm start
   ```

5. **Open the interactive dashboard in your browser**
   Visit: **`http://localhost:3000`**

6. **Run the automated test suite**
   ```bash
   npm test
   ```

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

---

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks` | List tasks (with filters & search) |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Update task status (`open`, `in_progress`, `completed`, `archived`) |
| PATCH | `/api/tasks/:id/assign` | Assign task to user |
| DELETE | `/api/tasks/:id` | Delete task |

**Query Parameters for `GET /api/tasks`:**
- `status` — Filter by status: `open`, `in_progress`, `completed`, `archived`
- `priority` — Filter by priority: `low`, `medium`, `high`, `urgent`
- `assignee` — Filter by assignee Mongo ID (use `me` for current user)
- `teamId` — Filter by team Mongo ID
- `search` — Regex search on title and description
- `sortBy` — Sort field: `createdAt`, `dueDate`, `priority` (default: `createdAt`)
- `order` — Sort order: `ASC`, `DESC` (default: `DESC`)
- `page` — Page number (default: `1`)
- `limit` — Items per page (default: `10`, max: `100`)

---

### Team Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/teams` | Create a new team |
| GET | `/api/teams` | List user's teams |
| GET | `/api/teams/:teamId` | Get team details |
| PUT | `/api/teams/:teamId` | Update team (owner/admin) |
| DELETE | `/api/teams/:teamId` | Delete team (owner only) |
| POST | `/api/teams/:teamId/members` | Add member by email |
| DELETE | `/api/teams/:teamId/members/:userId` | Remove member |
| PATCH | `/api/teams/:teamId/members/:userId/role` | Change member role (`admin`, `member`) |

---

### Comment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/:taskId/comments` | Add a comment |
| GET | `/api/tasks/:taskId/comments` | List comments |
| PUT | `/api/tasks/:taskId/comments/:id` | Update comment (author only) |
| DELETE | `/api/tasks/:taskId/comments/:id` | Delete comment (author only) |

---

### Attachment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/:taskId/attachments` | Upload file attachment (multipart) |
| GET | `/api/tasks/:taskId/attachments` | List attachments |
| GET | `/api/tasks/:taskId/attachments/:id/download` | Download file |
| DELETE | `/api/tasks/:taskId/attachments/:id` | Delete attachment |

---

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List user's notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

---

### AI Endpoints (Optional)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-description` | Generate task description from prompt |
| POST | `/api/ai/summarize-task` | Summarize a task and its comments |

---

## WebSocket Real-Time Notifications

Connect to `ws://localhost:3000/ws` for real-time notifications.

1. **Connect** to `ws://localhost:3000/ws`
2. **Authenticate** by sending:
   ```json
   {"type": "auth", "token": "your-jwt-token"}
   ```
3. **Receive live push events** for assignments, status changes, and comments.

---

## Testing with Postman

Import the included [`postman_collection.json`](file:///Users/smritisethi/Programming-git/Airtribe/taskmaster/postman_collection.json) file into Postman to test all routes.

## License

MIT
