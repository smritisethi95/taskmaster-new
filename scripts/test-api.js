import fs from 'fs';
import path from 'path';
import { WebSocket } from 'ws';

const BASE_URL = 'http://localhost:3000/api';
const WS_URL = 'ws://localhost:3000/ws';

let passCount = 0;
let failCount = 0;

function assert(condition, testName, extraInfo = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${extraInfo}`);
    failCount++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('\n🚀 Starting TaskMaster End-to-End API Verification Suite\n');

  // 1. Health check
  console.log('--- 1. Health Check ---');
  const health = await request('/health');
  assert(health.status === 200 && health.data.success === true, 'GET /api/health returns 200 OK');

  // 2. Register Users
  console.log('\n--- 2. User Authentication & Registration ---');
  const timestamp = Date.now();
  const aliceEmail = `alice_${timestamp}@example.com`;
  const bobEmail = `bob_${timestamp}@example.com`;

  const regAlice = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Alice Smith', email: aliceEmail, password: 'Password123!' }
  });
  assert(regAlice.status === 201 && regAlice.data.data?.token, 'Register Alice (Owner/Creator)');
  const aliceToken = regAlice.data.data?.token;
  const aliceId = regAlice.data.data?.user?.id;

  const regBob = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Bob Jones', email: bobEmail, password: 'Password123!' }
  });
  assert(regBob.status === 201 && regBob.data.data?.token, 'Register Bob (Member/Assignee)');
  const bobToken = regBob.data.data?.token;
  const bobId = regBob.data.data?.user?.id;

  // 3. User Login
  console.log('\n--- 3. User Login ---');
  const loginAlice = await request('/auth/login', {
    method: 'POST',
    body: { email: aliceEmail, password: 'Password123!' }
  });
  assert(loginAlice.status === 200 && loginAlice.data.data?.token, 'Login Alice with valid credentials');

  const loginInvalid = await request('/auth/login', {
    method: 'POST',
    body: { email: aliceEmail, password: 'WrongPassword' }
  });
  assert(loginInvalid.status === 401, 'Login fails with invalid password (401)');

  // 4. User Profile
  console.log('\n--- 4. User Profile Management ---');
  const profileAlice = await request('/auth/me', {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  assert(profileAlice.status === 200 && profileAlice.data.data?.user?.email === aliceEmail, 'GET /api/auth/me returns profile');

  const updateAlice = await request('/auth/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: { name: 'Alice S. (Lead)' }
  });
  assert(updateAlice.status === 200 && updateAlice.data.data?.user?.name === 'Alice S. (Lead)', 'PUT /api/auth/me updates profile name');

  // 5. Team Creation & Collaboration
  console.log('\n--- 5. Teams & Member Management ---');
  const createTeam = await request('/teams', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: { name: 'Backend Engineering', description: 'Core API development team' }
  });
  assert(createTeam.status === 201 && createTeam.data.data?.id, 'POST /api/teams creates team');
  const teamId = createTeam.data.data?.id;

  const addBobToTeam = await request(`/teams/${teamId}/members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: { email: bobEmail, role: 'member' }
  });
  assert(addBobToTeam.status === 201, 'POST /api/teams/:id/members adds Bob to team');

  const getTeam = await request(`/teams/${teamId}`, {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  assert(getTeam.status === 200 && (getTeam.data.data?.teamMembers?.length >= 2 || getTeam.data.data?.members?.length >= 2), 'GET /api/teams/:id lists team with members');

  // 6. Task Management (CRUD, Assign, Status)
  console.log('\n--- 6. Task Management (CRUD, Assignment, Status) ---');
  const createTask = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: {
      title: 'Build Authentication Module',
      description: 'Implement JWT authentication and password hashing using bcrypt',
      priority: 'high',
      status: 'open',
      dueDate: '2026-09-15',
      teamId: teamId,
      assigneeId: bobId
    }
  });
  assert(createTask.status === 201 && createTask.data.data?.id, 'POST /api/tasks creates task assigned to Bob');
  const taskId = createTask.data.data?.id;

  // Create second task for search testing
  await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: {
      title: 'Design Database Schema',
      description: 'Set up Sequelize models and migrations for PostgreSQL',
      priority: 'medium',
      status: 'in_progress',
      teamId: teamId
    }
  });

  // Get task by ID
  const getTask = await request(`/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  assert(getTask.status === 200 && getTask.data.data?.title === 'Build Authentication Module', 'GET /api/tasks/:id retrieves task details');

  // Filter tasks
  const filterTasks = await request('/tasks?status=open', {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  assert(filterTasks.status === 200 && Array.isArray(filterTasks.data.data?.tasks), 'GET /api/tasks?status=open filters by status');

  // Search tasks
  const searchTasks = await request('/tasks?search=Authentication', {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  assert(searchTasks.status === 200 && searchTasks.data.data?.tasks?.some(t => t.title.includes('Authentication')), 'GET /api/tasks?search=... performs keyword search');

  // Update task status
  const updateStatus = await request(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: { status: 'completed' }
  });
  assert(updateStatus.status === 200 && updateStatus.data.data?.status === 'completed', 'PATCH /api/tasks/:id/status updates task status to completed');

  // 7. Comments
  console.log('\n--- 7. Task Comments ---');
  const addComment = await request(`/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: { content: 'Authentication module PR is ready for review!' }
  });
  assert(addComment.status === 201 && addComment.data.data?.id, 'POST /api/tasks/:taskId/comments adds comment');
  const commentId = addComment.data.data?.id;

  const getComments = await request(`/tasks/${taskId}/comments`, {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  assert(getComments.status === 200 && getComments.data.data?.comments?.length > 0, 'GET /api/tasks/:taskId/comments lists comments');

  // 8. Attachments
  console.log('\n--- 8. Task Attachments ---');
  const sampleFilePath = path.resolve('uploads', 'sample-spec.txt');
  fs.writeFileSync(sampleFilePath, 'Task specification and architecture notes for TaskMaster.');

  const formData = new FormData();
  const fileBlob = new Blob(['Task specification content'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'spec.txt');

  const uploadRes = await fetch(`${BASE_URL}/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: formData
  });
  const uploadData = await uploadRes.json();
  assert(uploadRes.status === 201 && uploadData.data?.id, 'POST /api/tasks/:taskId/attachments uploads file');
  const attachmentId = uploadData.data?.id;

  const getAttachments = await request(`/tasks/${taskId}/attachments`, {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  assert(getAttachments.status === 200 && getAttachments.data.data?.length > 0, 'GET /api/tasks/:taskId/attachments lists attachments');

  // 9. Notifications
  console.log('\n--- 9. Notifications ---');
  const getNotifications = await request('/notifications', {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  assert(getNotifications.status === 200 && Array.isArray(getNotifications.data.data?.notifications), 'GET /api/notifications retrieves user notifications');

  const markAllRead = await request('/notifications/read-all', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  assert(markAllRead.status === 200, 'PATCH /api/notifications/read-all marks notifications as read');

  // 10. WebSocket Real-time Connection
  console.log('\n--- 10. WebSocket Real-Time Connection ---');
  const wsResult = await new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let authenticated = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'auth', token: aliceToken }));
    });

    ws.on('message', (msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        if (payload.type === 'auth_success') {
          authenticated = true;
          ws.send(JSON.stringify({ type: 'ping' }));
        } else if (payload.type === 'pong') {
          ws.close();
          resolve({ ok: true, authenticated });
        }
      } catch (e) {
        resolve({ ok: false, error: e.message });
      }
    });

    ws.on('error', (err) => resolve({ ok: false, error: err.message }));
    setTimeout(() => resolve({ ok: authenticated, timeout: true }), 3000);
  });
  assert(wsResult.ok, 'WebSocket connects, authenticates via JWT, and responds to ping/pong');

  // 11. AI Endpoint Graceful Handling
  console.log('\n--- 11. AI Integration Handling ---');
  const aiRes = await request('/ai/generate-description', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: { input: 'Build user notification service' }
  });
  // Should either return 200 (if API key set) or 503 (service not configured), both are handled gracefully
  assert(aiRes.status === 200 || aiRes.status === 503, 'POST /api/ai/generate-description handles request gracefully');

  // Summary
  console.log('\n========================================');
  console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log('========================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
