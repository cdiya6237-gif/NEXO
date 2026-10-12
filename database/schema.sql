-- ==============================================================================
-- NEXO Platform Relational Database Schema (PostgreSQL / SQLite Compatible)
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    password_hash VARCHAR(256),
    role VARCHAR(32) DEFAULT 'member', -- member, super_admin, finance_admin
    status VARCHAR(32) DEFAULT 'active', -- active, pending, suspended
    tier VARCHAR(16) DEFAULT 'SILVER', -- SILVER, GOLD
    vip_level VARCHAR(16) DEFAULT 'VIP 1',
    avatar_id INT DEFAULT 1,
    withdraw_address VARCHAR(128),
    referral_code VARCHAR(32) UNIQUE NOT NULL,
    referred_by VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Balances Table
CREATE TABLE IF NOT EXISTS user_balances (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    available_balance NUMERIC(12, 2) DEFAULT 0.00,
    hold_balance NUMERIC(12, 2) DEFAULT 0.00,
    commission_balance NUMERIC(12, 2) DEFAULT 0.00,
    total_earned NUMERIC(12, 2) DEFAULT 0.00,
    total_withdrawn NUMERIC(12, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table (Silver & Gold 25 Pipeline Items)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    marketplace VARCHAR(64) NOT NULL, -- Amazon, Shopify, Alibaba, etc.
    category VARCHAR(64) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    commission_rate NUMERIC(5, 4) DEFAULT 0.2500, -- 25%
    image_url TEXT,
    tier VARCHAR(16) NOT NULL, -- SILVER or GOLD
    order_number INT NOT NULL, -- 1 to 25
    status VARCHAR(16) DEFAULT 'active'
);

-- 4. Deposits Table
CREATE TABLE IF NOT EXISTS deposits (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(64) NOT NULL,
    user_full_name VARCHAR(128) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(32) DEFAULT 'USDT_TRC20',
    tx_hash VARCHAR(128) NOT NULL,
    screenshot_url TEXT,
    status VARCHAR(16) DEFAULT 'pending', -- pending, approved, rejected
    processed_by VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(64) NOT NULL,
    user_full_name VARCHAR(128) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    destination_address VARCHAR(128) NOT NULL,
    status VARCHAR(16) DEFAULT 'pending', -- pending, approved, rejected
    reject_reason TEXT,
    orders_completed_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by VARCHAR(64)
);

-- 6. Transactions Ledger Table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL, -- deposit, withdrawal, order_hold, order_commission, admin_adjustment, referral_bonus
    amount NUMERIC(12, 2) NOT NULL,
    available_balance_after NUMERIC(12, 2) NOT NULL,
    status VARCHAR(16) DEFAULT 'completed',
    title VARCHAR(128) NOT NULL,
    description TEXT,
    tag VARCHAR(32),
    reference_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL,
    admin_name VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target VARCHAR(128),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
