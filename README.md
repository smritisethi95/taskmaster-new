# TaskMaster — Collaborative Task Tracking System

A full-featured backend API for task tracking and team collaboration, built with **Node.js**, **Express.js**, **PostgreSQL**, and **Sequelize ORM**. Features include JWT authentication, real-time WebSocket notifications, file attachments, and optional AI-powered task generation via Google Gemini.

## Features

- **User Authentication** — Register, login, logout with JWT tokens and secure password hashing (bcryptjs)
- **Task Management** — Full CRUD with filtering, sorting, search, and pagination
- **Team Collaboration** — Create teams, invite members, role-based access control (owner/admin/member)
- **Comments** — Threaded comments on tasks with real-time notifications
- **File Attachments** — Upload, download, and manage file attachments on tasks
- **Real-time Notifications** — WebSocket-based push notifications for task assignments, status changes, and comments
- **AI Integration** — Generate task descriptions and summaries using Google Gemini (optional)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Sequelize v6 |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| Real-time | WebSocket (ws) |
| File Upload | Multer |
| AI | Google Generative AI (Gemini) |
| Validation | express-validator |
| Testing | Jest + Supertest |

## Project Structure

```
taskmaster/
├── server.js                  # Entry point
├── src/
│   ├── app.js                 # Express app configuration
│   ├── config/
│   │   ├── auth.js            # JWT configuration
│   │   └── database.js        # Sequelize/PostgreSQL config
│   ├── controllers/
│   │   ├── aiController.js    # AI generation endpoints
│   │   ├── attachmentController.js
│   │   ├── authController.js  # Authentication logic
│   │   ├── commentController.js
│   │   ├── notificationController.js
│   │   ├── taskController.js  # Task CRUD + filtering
│   │   └── teamController.js  # Team management
│   ├── middlewares/
│   │   ├── auth.js            # JWT auth + role authorization
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── upload.js          # Multer file upload config
│   │   └── validate.js        # Express-validator runner
│   ├── models/
│   │   ├── index.js           # Model loader + associations
│   │   ├── User.js
│   │   ├── Team.js
│   │   ├── TeamMember.js
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
├── .env.example               # Environment variables template
├── .gitignore
├── .sequelizerc
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** v9+

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
   Edit `.env` with your PostgreSQL credentials and JWT secret:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=taskmaster
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your-secure-random-string
   ```

4. **Create the database**
   ```bash
   createdb taskmaster
   ```

5. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

   The server will sync the database schema automatically on first run.

6. **Verify it's running**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Optional: AI Integration

To enable AI-powered task description generation, add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your-gemini-api-key
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All endpoints except `/api/auth/register` and `/api/auth/login` require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |
| POST | `/api/auth/logout` | Logout (invalidate token client-side) |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

**Register Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks` | List tasks (with filters) |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Update task status |
| PATCH | `/api/tasks/:id/assign` | Assign task to user |
| DELETE | `/api/tasks/:id` | Delete task |

**Query Parameters for `GET /api/tasks`:**
- `status` — Filter by status: `open`, `in_progress`, `completed`, `archived`
- `priority` — Filter by priority: `low`, `medium`, `high`, `urgent`
- `assignee` — Filter by assignee UUID (use `me` for current user)
- `teamId` — Filter by team UUID
- `search` — Full-text search on title and description
- `sortBy` — Sort field: `createdAt`, `dueDate`, `priority` (default: `createdAt`)
- `order` — Sort order: `ASC`, `DESC` (default: `DESC`)
- `page` — Page number (default: `1`)
- `limit` — Items per page (default: `10`, max: `100`)

**Create Task Example:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Implement user authentication",
    "description": "Set up JWT-based auth with bcrypt password hashing",
    "priority": "high",
    "dueDate": "2024-12-31",
    "teamId": "team-uuid",
    "assigneeId": "user-uuid"
  }'
```

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
| PATCH | `/api/teams/:teamId/members/:userId/role` | Change member role |

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
| POST | `/api/tasks/:taskId/attachments` | Upload file attachment |
| GET | `/api/tasks/:taskId/attachments` | List attachments |
| GET | `/api/tasks/:taskId/attachments/:id/download` | Download file |
| DELETE | `/api/tasks/:taskId/attachments/:id` | Delete attachment |

**Upload Example:**
```bash
curl -X POST http://localhost:3000/api/tasks/{taskId}/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/document.pdf"
```

---

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

---

### AI Endpoints (Optional)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-description` | Generate task description from brief input |
| POST | `/api/ai/summarize-task` | Summarize a task and its comments |

**Generate Description Example:**
```bash
curl -X POST http://localhost:3000/api/ai/generate-description \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"input": "implement password reset with email verification"}'
```

---

## WebSocket Notifications

Connect to `ws://localhost:3000/ws` for real-time notifications.

### Connection Flow

1. **Connect** to the WebSocket endpoint
2. **Authenticate** by sending:
   ```json
   {"type": "auth", "token": "your-jwt-token"}
   ```
3. **Receive** auth confirmation:
   ```json
   {"type": "auth_success", "message": "Authenticated"}
   ```
4. **Listen** for notifications:
   ```json
   {
     "type": "notification",
     "data": {
       "id": "uuid",
       "type": "task_assigned",
       "message": "You have been assigned to task: Implement auth",
       "metadata": {"taskId": "uuid"},
       "isRead": false,
       "createdAt": "2024-01-01T00:00:00.000Z"
     }
   }
   ```

### Notification Types

- `task_assigned` — A task has been assigned to you
- `task_status_updated` — A task's status has changed
- `comment_added` — A new comment on a task you're involved with
- `team_invite` — You've been added to a team

---

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [
    {"field": "email", "message": "Email is required"}
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (AI not configured) |

## License

MIT
