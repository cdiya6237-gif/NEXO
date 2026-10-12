export type UserRole = 'member' | 'super_admin' | 'finance_admin' | 'support_admin';
export type AccountStatus = 'pending' | 'active' | 'suspended';
export type TierStatus = 'SILVER' | 'GOLD';
export type VipLevel = 'VIP 1' | 'VIP 2' | 'VIP 3';

export interface LoginActivityItem {
  id: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  status: AccountStatus;
  tier: TierStatus;
  vipLevel: VipLevel;
  avatarId: number;
  avatarUrl?: string;
  withdrawAddress?: string;
  referralCode: string; // Every customer automatically receives a unique referral code
  referredBy?: string;  // Referral code of the verified referrer
  createdAt: string;
  lastLoginAt?: string;
  isOnline?: boolean;
  loginActivity?: LoginActivityItem[];
  notificationsEnabled: boolean;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  marketplace: string; // Amazon, Shopify, Alibaba, etc.
  category: string;
  price: number;
  commissionRate: number; // e.g. 0.25 (25%)
  imageUrl: string;
  status: 'active' | 'inactive';
  tierType?: 'silver' | 'gold' | 'standard';
  description?: string;
}

export interface CycleOrder {
  orderNumber: number; // 1 to 25
  productId: string;
  productName: string;
  marketplace: string;
  category: string;
  orderAmount: number;
  commissionRate: number; // 0.25
  estimatedCommission: number;
  imageUrl: string;
  tier?: TierStatus;
  completedAt?: string;
  status: 'pending' | 'completed';
}

export interface UserOrderProgress {
  userId: string;
  tier?: TierStatus;
  completedCount: number; // 0 to 25 (e.g. 6 of 25)
  currentOrderIndex: number; // 0 to 24 (or 25 when complete)
  orders: CycleOrder[];
  isCompleted: boolean;
  completedAt?: string;
  startedAt: string;
}

export type UserCycleState = UserOrderProgress;

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'order_hold' 
  | 'order_commission' 
  | 'commission'
  | 'release_25_orders' 
  | 'admin_adjustment' 
  | 'referral_bonus';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  availableBalanceAfter: number;
  balanceAfter?: number;
  holdBalanceAfter?: number;
  commissionBalanceAfter?: number;
  status: 'pending' | 'completed' | 'rejected';
  referenceId?: string; // orderId, depositId, etc.
  title: string;
  description: string;
  tag?: string; // e.g. AUTO_CONFIRMED, REFERRAL_10_PERCENT, RELEASED_25_OF_25
  createdAt: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  amount: number;
  method: 'Manual Wallet TRC20' | 'Payment Now Gate';
  trc20Address: string;
  txHash: string;
  receiptUrl?: string;
  receiptFileName?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  amount: number;
  destinationAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface AdminAdjustment {
  id: string;
  adminId: string;
  adminName: string;
  userId: string;
  username: string;
  userFullName?: string;
  type: 'credit' | 'debit' | 'commission_adjustment' | 'order_correction';
  amount: number;
  previousBalance: number;
  newBalance: number;
  reason: string;
  createdAt: string;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  destinationUrl?: string;
  displayOrder: number;
  status: 'active' | 'inactive';
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'support' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'open' | 'closed';
  unreadAdminCount: number;
  unreadCustomerCount: number;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // or 'all'
  title: string;
  message: string;
  type: 'order' | 'commission' | 'deposit' | 'withdrawal' | 'referral' | 'account' | 'announcement';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

export interface CustomerSession {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  tier: TierStatus;
  loginAt: string;
  lastPingAt: string;
  isOnline: boolean;
  device?: string;
  browser?: string;
  ipAddress?: string;
}

export interface ReferralRecord {
  id: string;
  referrerUsername: string;
  referrerUserId?: string;
  referredUserId: string;
  referredUsername: string;
  referredFullName: string;
  referralCodeUsed: string;
  registrationDate: string;
  status: 'pending' | 'active' | 'suspended';
  commissionRate: number; // 0.10 (10% of profit/earning)
  totalCommissionGenerated: number;
}
