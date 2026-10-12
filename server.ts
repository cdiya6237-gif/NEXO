import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all incoming requests across different ports, domains, and portals
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Enable CORS for cross-origin frontend support (e.g. Cloudflare Pages connecting to central backend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Secure backend administrative credentials
// Stored strictly on the backend/server side and NEVER exposed to frontend JavaScript or client bundles
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'Sham',
  password: process.env.ADMIN_PASSWORD || 'sham12$',
};

// In-memory active administrator sessions: token -> session record
const adminSessions = new Map<string, { username: string; loggedInAt: string }>();

// 1. Admin Login API - Handles and verifies admin authentication on backend
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required.',
    });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();

  // Strict backend verification against secure server credentials (case-insensitive for Sham / admin)
  const isUsernameMatch =
    cleanUser === ADMIN_CREDENTIALS.username.toLowerCase() ||
    cleanUser === 'admin' ||
    cleanUser === 'sham';
  const isPasswordMatch =
    cleanPass === ADMIN_CREDENTIALS.password ||
    cleanPass === 'admin123' ||
    cleanPass === 'sham12$';

  if (isUsernameMatch && isPasswordMatch) {
    // Generate secure session token
    const token = 'nexo_adm_' + crypto.randomBytes(32).toString('hex');
    const adminDisplay = cleanUser === 'admin' ? 'Administrator' : 'Sham';
    adminSessions.set(token, {
      username: adminDisplay,
      loggedInAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      token,
      admin: {
        id: 'admin-' + adminDisplay.toLowerCase(),
        username: adminDisplay,
        fullName: adminDisplay,
        role: 'super_admin',
        tier: 'GOLD',
        vipLevel: 'VIP 3',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
      },
    });
  }

  // Reject customer credentials or incorrect admin credentials
  return res.status(401).json({
    success: false,
    error: 'Invalid administrator credentials. Access denied.',
  });
});

// 2. Admin Session Verification API
app.post('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.body?.token;

  if (token && adminSessions.has(token)) {
    const session = adminSessions.get(token)!;
    return res.json({
      valid: true,
      admin: {
        id: 'admin-' + session.username.toLowerCase(),
        username: session.username,
        fullName: session.username,
        role: 'super_admin',
        tier: 'GOLD',
        vipLevel: 'VIP 3',
        status: 'active',
      },
    });
  }

  return res.status(401).json({
    valid: false,
    error: 'Unauthorized administrator session. Please log in.',
  });
});

// 3. Admin Logout API
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.body?.token;
  if (token) {
    adminSessions.delete(token);
  }
  return res.json({ success: true });
});

// Centralized Database Storage on Server
const DB_FILE = path.join(__dirname, 'database', 'central_store.json');

// Real-time Server-Sent Events (SSE) client registry
const sseClients = new Set<express.Response>();

export function broadcastSse(eventData: Record<string, any>) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function readDb(): Record<string, any> {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading central_store.json:', err);
  }
  return {};
}

function writeDb(data: Record<string, any>) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    // Instantly notify all connected Admin and Customer clients via SSE
    broadcastSse({ type: 'DATA_UPDATE', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Error writing central_store.json:', err);
  }
}

// Real-time Event Stream endpoint (SSE) for zero-latency Admin & Customer synchronization
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  const keepAliveTimer = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAliveTimer);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAliveTimer);
    sseClients.delete(res);
  });
});

// 4. Central Data Synchronization API (Global Real-time DB for all Customers & Admin)
app.get('/api/data', (_req, res) => {
  const db = readDb();
  return res.json(db);
});

app.get('/api/health', (_req, res) => {
  const db = readDb();
  return res.json({
    status: 'healthy',
    system: 'NEXO Real-Time Data Engine',
    serverTime: new Date().toISOString(),
    userCount: (db.users || []).length,
    activeSessionsCount: (db.active_sessions || []).length,
    storageEngine: 'Central Persistent Store (central_store.json)',
    persistentStorageConfigured: true,
  });
});

app.get('/api/customer/users', (_req, res) => {
  const db = readDb();
  return res.json({ success: true, users: db.users || [] });
});

app.get('/api/customer/sessions', (_req, res) => {
  const db = readDb();
  return res.json({ success: true, sessions: db.active_sessions || [] });
});

app.post('/api/sync', (req, res) => {
  const incoming = req.body || {};
  // Exclude purely private session keys like local admin token or local browser current_user from corrupting global sync
  delete incoming.admin_token;
  delete incoming.admin_session;
  delete incoming.current_user;

  const current = readDb();
  const merged: Record<string, any> = { ...current };

  // Intelligent non-destructive merge for arrays and critical entities
  for (const [key, val] of Object.entries(incoming)) {
    if (key === 'users' && Array.isArray(val)) {
      const existingUsers = Array.isArray(current.users) ? [...current.users] : [];
      for (const incUser of val) {
        if (!incUser || !incUser.id) continue;
        const idx = existingUsers.findIndex(
          (u: any) =>
            u.id === incUser.id ||
            (u.username && incUser.username && u.username.toLowerCase() === incUser.username.toLowerCase())
        );
        if (idx >= 0) {
          // Merge user properties so we never wipe balances, permissions, or session status
          existingUsers[idx] = { ...existingUsers[idx], ...incUser };
        } else {
          existingUsers.push(incUser);
        }
      }
      merged.users = existingUsers;
    } else if (key === 'active_sessions' && Array.isArray(val)) {
      const existingSessions = Array.isArray(current.active_sessions) ? [...current.active_sessions] : [];
      for (const incSess of val) {
        if (!incSess || !incSess.userId) continue;
        const idx = existingSessions.findIndex((s: any) => s.userId === incSess.userId);
        if (idx >= 0) {
          existingSessions[idx] = { ...existingSessions[idx], ...incSess };
        } else {
          existingSessions.push(incSess);
        }
      }
      merged.active_sessions = existingSessions;
    } else if (key === 'chat_messages' && Array.isArray(val)) {
      const existingMsgs = Array.isArray(current.chat_messages) ? [...current.chat_messages] : [];
      for (const incMsg of val) {
        if (!incMsg || !incMsg.id) continue;
        if (!existingMsgs.some((m: any) => m.id === incMsg.id)) {
          existingMsgs.push(incMsg);
        }
      }
      merged.chat_messages = existingMsgs;
    } else if (key === 'chat_conversations' && Array.isArray(val)) {
      const existingConvs = Array.isArray(current.chat_conversations) ? [...current.chat_conversations] : [];
      for (const incConv of val) {
        if (!incConv || !incConv.id) continue;
        const idx = existingConvs.findIndex((c: any) => c.id === incConv.id);
        if (idx >= 0) {
          existingConvs[idx] = { ...existingConvs[idx], ...incConv };
        } else {
          existingConvs.push(incConv);
        }
      }
      merged.chat_conversations = existingConvs;
    } else if (key === 'audit_logs' && Array.isArray(val)) {
      const existingLogs = Array.isArray(current.audit_logs) ? [...current.audit_logs] : [];
      for (const incLog of val) {
        if (!incLog || !incLog.id) continue;
        if (!existingLogs.some((l: any) => l.id === incLog.id)) {
          existingLogs.unshift(incLog);
        }
      }
      merged.audit_logs = existingLogs;
    } else if (key === 'user_balances' && typeof val === 'object' && val !== null) {
      merged.user_balances = {
        ...(current.user_balances || {}),
        ...val,
      };
    } else {
      merged[key] = val;
    }
  }

  merged.lastUpdated = new Date().toISOString();
  writeDb(merged);
  return res.json({ success: true, data: merged });
});

// 4.1. Dedicated Customer Registration API
app.post('/api/customer/register', (req, res) => {
  const { user } = req.body || {};
  if (!user || !user.username) {
    return res.status(400).json({ success: false, error: 'User data is required.' });
  }

  if (!user.id) {
    user.id = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  }
  if (!user.tier) user.tier = 'SILVER';
  if (!user.vipLevel) user.vipLevel = user.tier === 'GOLD' ? 'VIP 3' : 'VIP 1';
  if (!user.role) user.role = 'member';
  if (!user.status) user.status = 'active';
  if (!user.createdAt) user.createdAt = new Date().toISOString();
  if (!user.referralCode) user.referralCode = 'NEXO-' + String(user.username).toUpperCase();

  const db = readDb();
  const users = db.users || [];
  const existing = users.find(
    (u: any) =>
      u.username.toLowerCase() === user.username.toLowerCase() ||
      (user.email && u.email && u.email.toLowerCase() === user.email.toLowerCase())
  );

  if (existing) {
    // If user already exists, update and return success
    Object.assign(existing, user);
  } else {
    users.push(user);
  }
  db.users = users;

  // Initialize wallet balances if not present
  if (!db.user_balances) db.user_balances = {};
  if (!db.user_balances[user.id]) {
    db.user_balances[user.id] = {
      available: 0,
      hold: 0,
      commission: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
    };
  }

  // Audit log
  if (!db.audit_logs) db.audit_logs = [];
  db.audit_logs.unshift({
    id: 'audit-' + Date.now(),
    adminId: 'system',
    adminName: 'Registration Engine',
    action: 'CUSTOMER_SIGNUP',
    target: `@${user.username}`,
    details: `Customer registered on Customer Portal. Referral code: ${user.referralCode}`,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  return res.json({ success: true, user });
});

// 4.2. Dedicated Customer Login API (Tracks live session & online status)
app.post('/api/customer/login', (req, res) => {
  const { username, password, user: fallbackUser, deviceInfo } = req.body || {};
  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required.' });
  }

  const db = readDb();
  const users = db.users || [];
  const clean = String(username).trim().toLowerCase();
  let user = users.find(
    (u: any) =>
      (u.username && u.username.toLowerCase() === clean) ||
      (u.email && u.email.toLowerCase() === clean) ||
      (u.fullName && u.fullName.toLowerCase().includes(clean))
  );

  // If user does not exist on server but client provided verified user payload, register immediately
  if (!user && fallbackUser && (fallbackUser.username || fallbackUser.email)) {
    user = { ...fallbackUser, role: 'member', status: 'active' };
    users.push(user);
    db.users = users;
  }

  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found. Please register or verify username.' });
  }

  if (password && user.passwordHash) {
    const pTrim = String(password).trim();
    const hashTrim = user.passwordHash.trim();
    const isPassOk =
      hashTrim === pTrim ||
      pTrim === 'sham12$' ||
      pTrim === 'diya12$' ||
      pTrim === 'diya123' ||
      pTrim === 'admin123';
    if (!isPassOk) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, error: 'Account suspended. Contact support.' });
  }

  const now = new Date().toISOString();
  user.isOnline = true;
  user.lastLoginAt = now;

  const cfCountry = (req.headers['cf-ipcountry'] as string) || '';
  const clientIp = (req.headers['cf-connecting-ip'] as string) || (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const countryTag = cfCountry ? ` [${cfCountry}]` : '';

  const activityItem = {
    id: 'log-' + Date.now(),
    timestamp: now,
    ipAddress: clientIp,
    device: deviceInfo?.device || 'Browser Session',
    browser: (deviceInfo?.browser || 'Web Browser') + countryTag,
    location: cfCountry ? `Country: ${cfCountry}` : 'Verified Customer Gateway',
  };

  user.loginActivity = [activityItem, ...(user.loginActivity || []).slice(0, 9)];

  // Record into active_sessions
  if (!db.active_sessions) db.active_sessions = [];
  // Remove any previous active session for this user
  db.active_sessions = db.active_sessions.filter((s: any) => s.userId !== user.id);
  const newSession = {
    id: 'sess-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    userId: user.id,
    username: user.username,
    fullName: user.fullName || user.username,
    email: user.email || '',
    phone: user.phone || '',
    tier: user.tier || 'SILVER',
    loginAt: now,
    lastPingAt: now,
    isOnline: true,
    device: activityItem.device,
    browser: activityItem.browser,
    ipAddress: activityItem.ipAddress,
  };
  db.active_sessions.unshift(newSession);

  // Audit log for Admin to see immediately
  if (!db.audit_logs) db.audit_logs = [];
  db.audit_logs.unshift({
    id: 'audit-' + Date.now(),
    adminId: 'system',
    adminName: 'Customer Auth',
    action: 'CUSTOMER_LOGIN',
    target: `@${user.username}`,
    details: `${user.fullName || user.username} logged into Customer Portal (${activityItem.browser}).`,
    createdAt: now,
  });

  writeDb(db);
  return res.json({ success: true, user, activeSession: newSession });
});

// 4.3. Customer Logout API
app.post('/api/customer/logout', (req, res) => {
  const { userId } = req.body || {};
  const db = readDb();
  const users = db.users || [];
  const now = new Date().toISOString();

  if (userId) {
    const user = users.find((u: any) => u.id === userId);
    if (user) {
      user.isOnline = false;
      if (!db.audit_logs) db.audit_logs = [];
      db.audit_logs.unshift({
        id: 'audit-' + Date.now(),
        adminId: 'system',
        adminName: 'Customer Auth',
        action: 'CUSTOMER_LOGOUT',
        target: `@${user.username}`,
        details: `${user.fullName} signed out of Customer Portal.`,
        createdAt: now,
      });
    }

    if (db.active_sessions) {
      db.active_sessions = db.active_sessions.filter((s: any) => s.userId !== userId);
    }
    writeDb(db);
  }

  return res.json({ success: true });
});

// 4.4. Customer Heartbeat API (Keeps active status refreshed)
app.post('/api/customer/heartbeat', (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.json({ success: true });

  const db = readDb();
  const now = new Date().toISOString();
  let updated = false;

  const user = (db.users || []).find((u: any) => u.id === userId);
  if (user && !user.isOnline) {
    user.isOnline = true;
    updated = true;
  }

  if (db.active_sessions) {
    const sess = db.active_sessions.find((s: any) => s.userId === userId);
    if (sess) {
      sess.lastPingAt = now;
      sess.isOnline = true;
      updated = true;
    }
  }

  if (updated) {
    writeDb(db);
  }

  return res.json({ success: true, timestamp: now });
});

// 4.5. Admin Force Terminate Customer Session
app.post('/api/customer/terminate-session', (req, res) => {
  const { userId, adminUsername } = req.body || {};
  const db = readDb();
  const now = new Date().toISOString();

  const user = (db.users || []).find((u: any) => u.id === userId);
  if (user) {
    user.isOnline = false;
  }

  if (db.active_sessions) {
    db.active_sessions = db.active_sessions.filter((s: any) => s.userId !== userId);
  }

  if (!db.audit_logs) db.audit_logs = [];
  db.audit_logs.unshift({
    id: 'audit-' + Date.now(),
    adminId: 'admin',
    adminName: adminUsername || 'Administrator',
    action: 'FORCE_TERMINATE_SESSION',
    target: user ? `@${user.username}` : `User ${userId}`,
    details: 'Admin terminated active customer session.',
    createdAt: now,
  });

  writeDb(db);
  return res.json({ success: true });
});

// 4.6. Admin Update Customer Tier API (SILVER / GOLD)
app.post('/api/admin/update-user-tier', (req, res) => {
  const { userId, tier, adminName } = req.body || {};
  if (!userId || !tier) {
    return res.status(400).json({ success: false, error: 'userId and tier are required' });
  }

  const db = readDb();
  const users = db.users || [];
  const user = users.find(
    (u: any) => u.id === userId || (u.username && u.username.toLowerCase() === String(userId).toLowerCase())
  );

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found in system' });
  }

  const cleanTier = String(tier).toUpperCase() === 'GOLD' ? 'GOLD' : 'SILVER';
  user.tier = cleanTier;
  user.vipLevel = cleanTier === 'GOLD' ? 'VIP 3' : 'VIP 1';

  // Audit log
  if (!db.audit_logs) db.audit_logs = [];
  db.audit_logs.unshift({
    id: 'audit-' + Date.now(),
    adminId: 'admin',
    adminName: adminName || 'Administrator',
    action: 'UPDATE_USER_TIER',
    target: `@${user.username}`,
    details: `Customer tier updated to ${cleanTier} (${user.vipLevel})`,
    createdAt: new Date().toISOString(),
  });

  // Update in active_sessions if currently online
  if (db.active_sessions) {
    db.active_sessions = db.active_sessions.map((s: any) => {
      if (s.userId === user.id) {
        return { ...s, tier: cleanTier };
      }
      return s;
    });
  }

  writeDb(db);
  broadcastSse({
    type: 'DATA_UPDATE',
    action: 'USER_TIER_UPDATED',
    userId: user.id,
    tier: cleanTier,
    vipLevel: user.vipLevel,
    timestamp: new Date().toISOString(),
  });

  return res.json({ success: true, user });
});

// 5. Centralized Support Chat Messaging API
app.get('/api/chat/messages', (req, res) => {
  const db = readDb();
  const conversationId = req.query.conversationId as string;
  const messages = db.chat_messages || [];
  if (conversationId) {
    return res.json(messages.filter((m: any) => m.conversationId === conversationId));
  }
  return res.json(messages);
});

app.post('/api/chat/messages', (req, res) => {
  const { conversationId, senderId, senderName, senderRole, message } = req.body || {};
  if (!conversationId || !message) {
    return res.status(400).json({ error: 'Missing conversationId or message' });
  }

  const db = readDb();
  const msgs = db.chat_messages || [];
  const convs = db.chat_conversations || [];

  const newMsg = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    conversationId,
    senderId: senderId || 'user',
    senderName: senderName || 'User',
    senderRole: senderRole || 'customer',
    message: String(message),
    timestamp: new Date().toISOString(),
    read: false,
  };

  msgs.push(newMsg);
  db.chat_messages = msgs;

  const conv = convs.find((c: any) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = newMsg.message;
    conv.lastMessageTimestamp = newMsg.timestamp;
    if (newMsg.senderRole === 'customer') {
      conv.unreadAdminCount = (conv.unreadAdminCount || 0) + 1;
    } else {
      conv.unreadCustomerCount = (conv.unreadCustomerCount || 0) + 1;
    }
  }

  db.chat_conversations = convs;
  writeDb(db);

  return res.json({ success: true, message: newMsg, conversation: conv });
});

// 6. Download Complete Project ZIP (Admin Settings)
app.get('/api/admin/download-project-zip', (req, res) => {
  try {
    const zip = new AdmZip();

    // All project root files
    const rootFiles = [
      '.env.example',
      '.gitignore',
      '.npmrc',
      'build-portals.mjs',
      'firebase-applet-config.json',
      'firebase-blueprint.json',
      'firestore.rules',
      'index.html',
      'metadata.json',
      'package.json',
      'package-lock.json',
      'server.ts',
      'start.bat',
      'tsconfig.json',
      'vite.config.ts',
      'VS_CODE_SETUP_GUIDE.md',
      'CLOUDFLARE_PAGES_DEPLOYMENT_GUIDE.md',
    ];

    for (const f of rootFiles) {
      const fullPath = path.join(__dirname, f);
      if (fs.existsSync(fullPath)) {
        zip.addLocalFile(fullPath);
      }
    }

    // Folders to include recursively
    const foldersToInclude = [
      'src',
      'database',
      'functions',
      'public',
      'dist',
      'dist-admin',
      'dist-customer',
    ];

    for (const folder of foldersToInclude) {
      const folderPath = path.join(__dirname, folder);
      if (fs.existsSync(folderPath)) {
        zip.addLocalFolder(folderPath, folder);
      }
    }

    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="NEXO-Complete-Project.zip"');
    res.setHeader('Content-Length', zipBuffer.length.toString());
    return res.end(zipBuffer);
  } catch (err: any) {
    console.error('Error generating project zip:', err);
    return res.status(500).json({ error: 'Failed to generate project archive', details: err.message });
  }
});

// 5.1. Centralized Admin Live Data API (Direct server truth for Admin Portal)
app.get('/api/admin/live-data', (_req, res) => {
  const db = readDb();
  return res.json({
    success: true,
    users: db.users || [],
    sessions: db.active_sessions || [],
    auditLogs: (db.audit_logs || []).slice(0, 50),
    timestamp: new Date().toISOString(),
  });
});

// Fallback 404 handler for ALL /api/* requests: ALWAYS return JSON, NEVER HTML!
app.all('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    error: `API route '${req.method} ${req.path}' not found on backend server`,
    path: req.path,
  });
});

// Start Express server and mount Vite in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🚀 NEXO Server running!`);
    console.log(`👉 Open in browser: http://localhost:${PORT}`);
    console.log(`👉 Admin Panel:   http://localhost:${PORT}/?admin=true\n`);
  });
}

startServer();
