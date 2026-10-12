-- ======================================================================
-- NEXO PLATFORM — CLOUDFLARE D1 DATABASE PRODUCTION SCHEMA
-- ======================================================================
-- This schema powers the centralized production database for both the
-- Customer Portal and the Admin Control Center on Cloudflare Pages.
--
-- All global user registrations, logins, balances, order progressions,
-- tiers (Silver / Gold), and audit logs are persistently stored here.
-- ======================================================================

-- 1. Global Key-Value Atomic Store
CREATE TABLE IF NOT EXISTS nexo_global_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 2. Registered Users (Customers & Administrators)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  tier TEXT NOT NULL DEFAULT 'SILVER',
  vipLevel TEXT NOT NULL DEFAULT 'VIP 1',
  avatarId INTEGER DEFAULT 1,
  referralCode TEXT,
  referredBy TEXT,
  isOnline INTEGER DEFAULT 0,
  lastLoginAt TEXT,
  loginActivity TEXT,
  notificationsEnabled INTEGER DEFAULT 1,
  notes TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- 3. Customer Financial Balances
CREATE TABLE IF NOT EXISTS user_balances (
  userId TEXT PRIMARY KEY,
  available REAL NOT NULL DEFAULT 0,
  hold REAL NOT NULL DEFAULT 0,
  commission REAL NOT NULL DEFAULT 0,
  totalEarned REAL NOT NULL DEFAULT 0,
  totalWithdrawn REAL NOT NULL DEFAULT 0,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Active Sessions (Real-time tracking of online customers)
CREATE TABLE IF NOT EXISTS active_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  username TEXT NOT NULL,
  fullName TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tier TEXT NOT NULL DEFAULT 'SILVER',
  loginAt TEXT NOT NULL,
  lastPingAt TEXT NOT NULL,
  isOnline INTEGER NOT NULL DEFAULT 1,
  device TEXT,
  browser TEXT,
  ipAddress TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_userId ON active_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_active_sessions_online ON active_sessions(isOnline);

-- 5. Governance & Security Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  adminId TEXT NOT NULL,
  adminName TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt);

-- 6. Customer Transactions (Commissions, Returns, Adjustments)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  balanceAfter REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);

-- 7. Deposit Requests
CREATE TABLE IF NOT EXISTS deposit_requests (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  username TEXT NOT NULL,
  userFullName TEXT NOT NULL,
  amount REAL NOT NULL,
  network TEXT NOT NULL DEFAULT 'USDT-TRC20',
  status TEXT NOT NULL DEFAULT 'pending',
  proofImageUrl TEXT,
  createdAt TEXT NOT NULL
);

-- 8. Withdrawal Requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  username TEXT NOT NULL,
  userFullName TEXT NOT NULL,
  amount REAL NOT NULL,
  walletAddress TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'USDT-TRC20',
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL
);

-- 9. Real-Time Chat Support Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  senderName TEXT NOT NULL,
  senderRole TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  isRead INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversationId);

-- 10. Real-Time Chat Support Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL,
  customerName TEXT NOT NULL,
  customerEmail TEXT,
  lastMessage TEXT,
  lastMessageTimestamp TEXT,
  unreadCountAdmin INTEGER DEFAULT 0,
  unreadCountCustomer INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open'
);

-- 11. Platform Settings & Configurations
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Seed Default Super Administrator
INSERT OR IGNORE INTO users (
  id, fullName, username, email, phone, passwordHash,
  role, status, tier, vipLevel, avatarId, referralCode,
  isOnline, createdAt
) VALUES (
  'user-admin', 'System Administrator', 'admin', 'admin@nexo.commerce',
  '+1 8005550199', 'admin123', 'super_admin', 'active', 'GOLD', 'VIP 3',
  1, 'NEXO-ADMIN', 0, '2026-01-01T00:00:00Z'
);

INSERT OR IGNORE INTO user_balances (
  userId, available, hold, commission, totalEarned, totalWithdrawn
) VALUES (
  'user-admin', 0, 0, 0, 0, 0
);
