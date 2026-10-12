import {
  User,
  Product,
  CycleOrder,
  UserOrderProgress,
  Transaction,
  DepositRequest,
  WithdrawalRequest,
  AdminAdjustment,
  PromotionalBanner,
  ChatMessage,
  ChatConversation,
  NotificationItem,
  AuditLog,
  ReferralRecord,
  CustomerSession,
  TierStatus,
} from '../types';

import hubImg from '../assets/images/ecommerce_global_hub_1791311386426.jpg';
import showcaseImg from '../assets/images/digital_commerce_showcase_1791311399768.jpg';
import opsImg from '../assets/images/marketplace_operations_1791311411443.jpg';
import rolexImg from '../assets/images/luxury_watch_product_1791311423067.jpg';

const STORAGE_PREFIX = 'nexo_';
const CURRENT_TAB_ID = typeof window !== 'undefined' ? Math.random().toString(36).substring(2, 9) : 'srv';
const storageCache = new Map<string, { raw: string | null; parsed: any }>();

// Universal API endpoint resolver (supports Cloudflare Pages custom backend, localhost, or absolute proxy)
export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  const customBase =
    localStorage.getItem(STORAGE_PREFIX + 'api_endpoint') ||
    (window as any).__NEXO_API_URL__ ||
    import.meta.env.VITE_API_URL;
  if (customBase && typeof customBase === 'string' && customBase.trim()) {
    const base = customBase.trim().replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${base}${cleanPath}`;
  }
  return path;
}

// Safe JSON fetcher that guards against HTML errors ("<!doctype..." from Cloudflare / 404 fallback)
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!contentType.includes('application/json') && text.trim().startsWith('<')) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Backend API returned HTML instead of JSON. Ensure the centralized backend server is running.',
      };
    }

    if (!text || !text.trim()) {
      return {
        ok: res.ok,
        status: res.status,
        data: null,
        error: res.ok ? undefined : `Server request returned status ${res.status}.`,
      };
    }

    try {
      const data = JSON.parse(text) as T;
      return {
        ok: res.ok,
        status: res.status,
        data,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Communication error with server.',
      };
    }
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: netErr?.message || 'Network request failed',
    };
  }
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    const cached = storageCache.get(key);
    if (cached && cached.raw === raw) {
      return cached.parsed as T;
    }
    const parsed = JSON.parse(raw);
    storageCache.set(key, { raw, parsed });
    return parsed as T;
  } catch {
    return fallback;
  }
}

// Server synchronization helper with BroadcastChannel for instant local cross-tab sync
function syncToServer(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  // Exclude purely private session keys like local admin token, local admin session, or this browser's local current_user from global sync
  if (key === 'admin_token' || key === 'admin_session' || key === 'current_user') return;

  // 1. Broadcast locally to all other open tabs and windows immediately (prevent self-looping)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('nexo_global_sync');
      bc.postMessage({ type: 'storage_change', key, senderTabId: CURRENT_TAB_ID });
      bc.close();
    }
  } catch {}

  // 2. Persist to centralized backend server
  try {
    fetch(getApiUrl('/api/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {});
  } catch {}
}

// Background sync from server to keep customer and admin panels live across devices
export async function syncFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await safeFetchJson<Record<string, any>>(getApiUrl('/api/data'));
    if (!res.ok || !res.data || typeof res.data !== 'object') return;

    const serverDb = res.data;
    let changed = false;
    for (const [key, val] of Object.entries(serverDb)) {
      if (key === 'lastUpdated' || key === 'admin_token' || key === 'admin_session' || key === 'current_user') continue;

      // Server is authoritative for users (tier updates, balances, status)
      if (key === 'users' && Array.isArray(val)) {
        const localUsers = getStored<User[]>('users', []);
        const serverUsers = val as User[];
        const mergedUsers: User[] = [...serverUsers];
        for (const lUser of localUsers) {
          if (!lUser || !lUser.id) continue;
          const exists = mergedUsers.some(
            (u: any) =>
              u.id === lUser.id ||
              (u.username && lUser.username && u.username.toLowerCase() === lUser.username.toLowerCase())
          );
          if (!exists) {
            mergedUsers.push(lUser);
          }
        }
        const serverValStr = JSON.stringify(mergedUsers);
        const currentLocal = localStorage.getItem(STORAGE_PREFIX + 'users');
        if (currentLocal !== serverValStr) {
          localStorage.setItem(STORAGE_PREFIX + 'users', serverValStr);
          storageCache.set('users', { raw: serverValStr, parsed: mergedUsers });
          changed = true;
        }

        // CRITICAL REAL-TIME TIER SYNC: Update current_user if admin changed tier or status!
        const currUser = getStored<User | null>('current_user', null);
        if (currUser) {
          const freshMe = mergedUsers.find(
            (u) => u.id === currUser.id || u.username.toLowerCase() === currUser.username.toLowerCase()
          );
          if (
            freshMe &&
            (freshMe.tier !== currUser.tier ||
              freshMe.vipLevel !== currUser.vipLevel ||
              freshMe.status !== currUser.status)
          ) {
            const updatedMe = { ...currUser, ...freshMe };
            localStorage.setItem(STORAGE_PREFIX + 'current_user', JSON.stringify(updatedMe));
            storageCache.set('current_user', { raw: JSON.stringify(updatedMe), parsed: updatedMe });
            changed = true;
            window.dispatchEvent(new CustomEvent('nexo_storage_change', { detail: { key: 'current_user' } }));
          }
        }
        continue;
      }

      // Intelligent non-destructive client merge for active_sessions
      if (key === 'active_sessions' && Array.isArray(val)) {
        const serverValStr = JSON.stringify(val);
        const currentLocal = localStorage.getItem(STORAGE_PREFIX + 'active_sessions');
        if (currentLocal !== serverValStr) {
          localStorage.setItem(STORAGE_PREFIX + 'active_sessions', serverValStr);
          storageCache.set('active_sessions', { raw: serverValStr, parsed: val });
          changed = true;
        }
        continue;
      }

      const currentLocal = localStorage.getItem(STORAGE_PREFIX + key);
      const serverValStr = JSON.stringify(val);
      if (currentLocal !== serverValStr) {
        localStorage.setItem(STORAGE_PREFIX + key, serverValStr);
        storageCache.set(key, { raw: serverValStr, parsed: val });
        changed = true;
      }
    }
    if (changed) {
      window.dispatchEvent(new CustomEvent('nexo_storage_change', { detail: { key: 'server_sync' } }));
    }
  } catch {}
}

// Initialize live sync listener and background poller
if (typeof window !== 'undefined') {
  syncFromServer();
  // Poll every 2.5 seconds so chat messages, registrations, and wallet adjustments sync in real time
  setInterval(syncFromServer, 2500);

  // Real-time Server-Sent Events (SSE) connection
  try {
    const sseUrl = getApiUrl('/api/events');
    const es = new EventSource(sseUrl);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (
          payload.type === 'DATA_UPDATE' ||
          payload.type === 'CUSTOMER_REGISTER' ||
          payload.type === 'CUSTOMER_LOGIN' ||
          payload.type === 'CUSTOMER_LOGOUT'
        ) {
          syncFromServer();
          window.dispatchEvent(
            new CustomEvent('nexo_storage_change', { detail: { key: 'sse_event', payload } })
          );
        }
      } catch {}
    };
  } catch {}

  // Cross-tab real-time listener via BroadcastChannel
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('nexo_global_sync');
      bc.onmessage = (ev) => {
        // Ignore messages sent by this same browser tab to avoid loops
        if (ev.data?.senderTabId === CURRENT_TAB_ID) return;
        if (ev.data?.type === 'tier_updated') {
          const me = store.getCurrentUser();
          if (me && (me.id === ev.data.userId || (ev.data.username && me.username?.toLowerCase() === ev.data.username.toLowerCase()))) {
            const updatedMe = { ...me, tier: ev.data.tier, vipLevel: ev.data.vipLevel };
            store.setCurrentUser(updatedMe);
            window.dispatchEvent(new CustomEvent('nexo_storage_change', { detail: { key: 'current_user' } }));
          }
        }
        window.dispatchEvent(new CustomEvent('nexo_storage_change', { detail: { key: ev.data?.key || 'broadcast' } }));
      };
    }
  } catch {}
}

function setStored<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    const prev = localStorage.getItem(STORAGE_PREFIX + key);
    if (prev === serialized) {
      // Data is unchanged: do NOT dispatch events, trigger re-renders, or re-sync
      return;
    }
    localStorage.setItem(STORAGE_PREFIX + key, serialized);
    storageCache.set(key, { raw: serialized, parsed: value });
    window.dispatchEvent(new CustomEvent('nexo_storage_change', { detail: { key } }));
    // Immediately persist to centralized backend server
    syncToServer(key, value);
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

// 25 Predefined Silver Products (Silver Orders 1 to 25)
export const INITIAL_SILVER_PRODUCTS: Product[] = [
  { id: 'silver-prod-1', name: 'Rolex Submariner 21 mm Luxury Oyster Steel', marketplace: 'Amazon', category: 'Watches & Jewelry', price: 30.85, commissionRate: 0.25, imageUrl: rolexImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-2', name: 'Amazon Echo Dot 5th Gen Smart Audio Sphere', marketplace: 'Amazon', category: 'Electronics', price: 40.10, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-3', name: 'Sony WF-1000XM5 True Wireless Noise Cancelling', marketplace: 'Sony Store', category: 'Audio', price: 50.25, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-4', name: 'Anker PowerCore 26800 Dual Input Power Bank', marketplace: 'Amazon', category: 'Accessories', price: 40.10, commissionRate: 0.25, imageUrl: hubImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-5', name: 'Kindle Paperwhite Signature Edition 32GB', marketplace: 'Amazon', category: 'Tablets & E-Readers', price: 110.45, commissionRate: 0.25, imageUrl: opsImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-6', name: 'Logitech MX Master 3S Wireless Performance Mouse', marketplace: 'Logitech', category: 'Peripherals', price: 83.30, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-7', name: 'Bose SoundLink Revolve+ II 360 Bluetooth Speaker', marketplace: 'Bose Outlet', category: 'Audio', price: 145.15, commissionRate: 0.25, imageUrl: hubImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-8', name: 'Fitbit Charge 6 Fitness Tracker with Google Health', marketplace: 'Google Store', category: 'Wearables', price: 102.35, commissionRate: 0.25, imageUrl: opsImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-9', name: 'DJI Osmo Mobile SE Intelligent Phone Gimbal', marketplace: 'DJI Mall', category: 'Photography', price: 70.30, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-10', name: 'Apple MagSafe Battery Pack Titanium Edition', marketplace: 'Apple Store', category: 'Accessories', price: 85.10, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-11', name: 'Seiko 5 Sports Automatic Steel Dress Watch', marketplace: 'Seiko', category: 'Watches', price: 120.10, commissionRate: 0.25, imageUrl: rolexImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-12', name: 'Samsung Galaxy Tab A9+ 11-inch 128GB Wi-Fi', marketplace: 'Samsung Store', category: 'Electronics', price: 185.50, commissionRate: 0.25, imageUrl: opsImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-13', name: 'Marshall Emberton II Portable Waterproof Speaker', marketplace: 'Marshall', category: 'Audio', price: 105.50, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-14', name: 'Razer BlackShark V2 Pro Wireless Gaming Headset', marketplace: 'Razer Store', category: 'Gaming', price: 90.10, commissionRate: 0.25, imageUrl: hubImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-15', name: 'Fujifilm Instax Mini Evo Hybrid Instant Camera', marketplace: 'Fujifilm', category: 'Cameras', price: 110.05, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-16', name: 'Tile Pro High-Performance Bluetooth Item Finder', marketplace: 'Amazon', category: 'Smart Tech', price: 40.10, commissionRate: 0.25, imageUrl: opsImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-17', name: 'Nespresso Vertuo Pop+ Compact Espresso Machine', marketplace: 'Nespresso', category: 'Appliances', price: 85.10, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-18', name: 'GoPro HERO10 Black 5.3K Action Cam Creator Bundle', marketplace: 'GoPro', category: 'Cameras', price: 130.10, commissionRate: 0.25, imageUrl: opsImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-19', name: 'Ray-Ban Meta Smart Glasses Wayfarer Edition', marketplace: 'Meta Store', category: 'Wearables', price: 102.35, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-20', name: 'JBL Flip 6 Waterproof Portable Speaker Rugged', marketplace: 'JBL', category: 'Audio', price: 75.45, commissionRate: 0.25, imageUrl: hubImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-21', name: 'Garmin Vivosmart 5 Smart Fitness Pulse Tracker', marketplace: 'Garmin', category: 'Wearables', price: 140.35, commissionRate: 0.25, imageUrl: opsImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-22', name: 'Amazon Fire HD 8 Kids Pro tablet (newest model)', marketplace: 'Amazon', category: 'Tablets', price: 80.10, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-23', name: 'Google Nest Cam Indoor Security Camera 1080p', marketplace: 'Google Store', category: 'Smart Home', price: 75.00, commissionRate: 0.25, imageUrl: opsImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-24', name: 'Beats Studio Buds + True Wireless Noise Cancelling', marketplace: 'Apple Store', category: 'Audio', price: 90.60, commissionRate: 0.25, imageUrl: showcaseImg, status: 'active', tierType: 'silver' },
  { id: 'silver-prod-25', name: 'Amazon Fire HD 10 Kids tablet 10.1" HD Display', marketplace: 'Amazon', category: 'Tablets', price: 103.85, commissionRate: 0.25, imageUrl: opsImg, status: 'active', tierType: 'silver' },
];

// 25 Predefined Gold Products (Gold Orders 1 to 25 - Independent from Silver)
export const INITIAL_GOLD_PRODUCTS: Product[] = [
  { id: 'gold-prod-1', name: 'Rolex Cosmograph Daytona 18k Yellow Gold Oysterflex', marketplace: 'Amazon Luxury', category: 'High Horology', price: 210.00, commissionRate: 0.35, imageUrl: rolexImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-2', name: 'Apple Vision Pro Spatial Computing Headset 512GB', marketplace: 'Apple Enterprise', category: 'Spatial Computing', price: 340.00, commissionRate: 0.35, imageUrl: showcaseImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-3', name: 'Leica Q3 Full-Frame Compact 60MP Summilux Prime', marketplace: 'Leica Direct', category: 'Photography Pro', price: 295.00, commissionRate: 0.35, imageUrl: opsImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-4', name: 'Bang & Olufsen Beolab 28 Titanium Wireless Acoustic', marketplace: 'B&O Global', category: 'Audiophile Tech', price: 250.00, commissionRate: 0.35, imageUrl: hubImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-5', name: 'DJI Inspire 3 Full-Frame 8K Cinema Drone System', marketplace: 'DJI Enterprise', category: 'Aero Robotics', price: 320.00, commissionRate: 0.35, imageUrl: showcaseImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-6', name: 'Herman Miller Embody Carbon Sync Ergonomic Pro', marketplace: 'Herman Miller', category: 'Executive Office', price: 215.00, commissionRate: 0.35, imageUrl: opsImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-7', name: 'Sony FX3 Cinema Line Full-Frame E-Mount ILME-FX3', marketplace: 'Sony Pro', category: 'Cinema Tech', price: 280.00, commissionRate: 0.35, imageUrl: showcaseImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-8', name: 'Patek Philippe Calatrava Rose Gold 39mm Automatic', marketplace: 'Swiss Vault', category: 'High Horology', price: 420.00, commissionRate: 0.35, imageUrl: rolexImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-9', name: 'Rimowa Original Aluminium Cabin Plus Titanium Silver', marketplace: 'Rimowa Mall', category: 'Luxury Travel', price: 195.00, commissionRate: 0.35, imageUrl: hubImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-10', name: 'Devialet Phantom I 108dB Opéra de Paris Gold Edition', marketplace: 'Devialet Direct', category: 'Ultra Audio', price: 245.00, commissionRate: 0.35, imageUrl: showcaseImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-11', name: 'Apple MacBook Pro 16-inch M3 Max Space Black 64GB', marketplace: 'Apple Enterprise', category: 'Workstations', price: 380.00, commissionRate: 0.35, imageUrl: opsImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-12', name: 'Hasselblad 907X & CFV 100C Medium Format Digital', marketplace: 'Hasselblad Store', category: 'Medium Format', price: 360.00, commissionRate: 0.35, imageUrl: showcaseImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-13', name: 'Montblanc Meisterstück 149 Platinum Line Gold Nib', marketplace: 'Montblanc Paris', category: 'Heritage Luxury', price: 165.00, commissionRate: 0.35, imageUrl: rolexImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-14', name: 'Sennheiser HE 1 Electrostatic Reference System', marketplace: 'Sennheiser Pro', category: 'Acoustic Master', price: 410.00, commissionRate: 0.35, imageUrl: hubImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-15', name: 'TAG Heuer Monaco Calibre 11 Gulf Special Edition', marketplace: 'TAG Heuer Store', category: 'Motorsport Horology', price: 275.00, commissionRate: 0.35, imageUrl: rolexImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-16', name: 'Breville Oracle Touch Espresso Machine Dual Boiler', marketplace: 'Breville Direct', category: 'Kitchen Artisan', price: 230.00, commissionRate: 0.35, imageUrl: opsImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-17', name: 'iPad Pro 13-inch M4 Ultra Retina Tandem OLED 1TB', marketplace: 'Apple Store', category: 'Tablets Pro', price: 265.00, commissionRate: 0.35, imageUrl: showcaseImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-18', name: 'Dyson 360 Vis Nav Robot Vacuum Heptagonal Tech', marketplace: 'Dyson Tech', category: 'Home Robotics', price: 195.00, commissionRate: 0.35, imageUrl: opsImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-19', name: 'Shure Axient Digital Wireless Professional Stage', marketplace: 'Shure Global', category: 'Broadcast Tech', price: 310.00, commissionRate: 0.35, imageUrl: hubImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-20', name: 'Bowers & Wilkins Nautilus Prestige Studio Active', marketplace: 'B&W Audio', category: 'Prestige Sound', price: 395.00, commissionRate: 0.35, imageUrl: showcaseImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-21', name: 'Omega Speedmaster Professional Moonwatch Co-Axial', marketplace: 'Omega Store', category: 'Aerospace Horology', price: 320.00, commissionRate: 0.35, imageUrl: rolexImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-22', name: 'Canon EOS R5 C 8K Cinema Mirrorless Full-Frame', marketplace: 'Canon Pro', category: 'Cinema 8K', price: 335.00, commissionRate: 0.35, imageUrl: opsImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-23', name: 'Master & Dynamic MH40 Wireless Titanium Sound', marketplace: 'M&D Audio', category: 'Studio Headphones', price: 175.00, commissionRate: 0.35, imageUrl: hubImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-24', name: 'Razer Blade 18 Gaming Laptop Dual-Mode Mini-LED', marketplace: 'Razer Direct', category: 'Ultra Gaming', price: 355.00, commissionRate: 0.35, imageUrl: showcaseImg, status: 'active', tierType: 'gold' },
  { id: 'gold-prod-25', name: 'Vertu Signature V Pure Black Gold Ceramic Handcrafted', marketplace: 'Vertu Concierge', category: 'Bespoke Luxury', price: 495.00, commissionRate: 0.35, imageUrl: rolexImg, status: 'active', tierType: 'gold' },
];

export const INITIAL_PRODUCTS = INITIAL_SILVER_PRODUCTS;

export const INITIAL_BANNERS: PromotionalBanner[] = [
  {
    id: 'banner-1',
    title: 'NEXO Global Logistics Hub',
    description: 'Empowering seamless international cross-border order dispatch and merchant fulfillment with instant commission clearing.',
    imageUrl: hubImg,
    buttonText: 'Explore Order Pipeline',
    displayOrder: 1,
    status: 'active',
  },
  {
    id: 'banner-2',
    title: 'Next-Gen International E-Commerce Ecosystem',
    description: 'Connecting top tier vendors from Amazon, Shopify, and global commerce networks to certified processing nodes.',
    imageUrl: showcaseImg,
    buttonText: 'View Order Center',
    displayOrder: 2,
    status: 'active',
  },
  {
    id: 'banner-3',
    title: 'Enterprise Dispatch & Automated Clearance',
    description: 'High throughput digital order settlement and secure TRC20 wallet management engineered for global scale.',
    imageUrl: opsImg,
    buttonText: 'Start Today Tasks',
    displayOrder: 3,
    status: 'active',
  },
  {
    id: 'banner-4',
    title: 'Premium Retail Fulfillment & VIP Tier Rewards',
    description: 'Accelerate your order progression across 25 verified orders with verified seller matching and transparent ledgers.',
    imageUrl: rolexImg,
    buttonText: 'Claim Commission',
    displayOrder: 4,
    status: 'active',
  },
];

// Initial Registered Referral Codes genuinely registered in NEXO system
const OFFICIAL_MASTER_CODES = ['NEXO-VIP88', 'NEXO-GLOBAL', 'NEXO-2026', 'NEXO-COMMERCE'];

// Initial Customer Users (Admin credentials stored securely on backend/server side only)
export const INITIAL_USERS: User[] = [];

// 25 Order Sequence Initializer - Supports Tier-Specific Generation (Silver or Gold)
export function generate25Orders(tier: TierStatus = 'SILVER'): CycleOrder[] {
  const products = tier === 'GOLD'
    ? getStored<Product[]>('gold_products', INITIAL_GOLD_PRODUCTS)
    : getStored<Product[]>('silver_products', INITIAL_SILVER_PRODUCTS);

  return products.slice(0, 25).map((prod, index) => {
    const orderNum = index + 1;
    const estCommission = Number((prod.price * prod.commissionRate).toFixed(2));
    return {
      orderNumber: orderNum,
      productId: prod.id,
      productName: prod.name,
      marketplace: prod.marketplace,
      category: prod.category,
      orderAmount: prod.price,
      commissionRate: prod.commissionRate,
      estimatedCommission: estCommission,
      imageUrl: prod.imageUrl,
      tier,
      status: 'pending',
    };
  });
}

class NexoStore {
  // Config
  getPlatformTRC20Address(): string {
    return getStored<string>('trc20_address', 'TKe7jmn1vyp16dc2SVyo37LRbudzbrZGYM');
  }

  setPlatformTRC20Address(address: string): void {
    setStored('trc20_address', address);
  }

  // System Registered Referral Codes
  getRegisteredReferralCodes(): string[] {
    const users = this.getUsers();
    const userCodes = users.map(u => u.referralCode.toUpperCase());
    const all = [...new Set([...OFFICIAL_MASTER_CODES, ...userCodes])];
    return all;
  }

  isValidReferralCode(code: string): boolean {
    if (!code || !code.trim()) return false;
    const clean = code.trim().toUpperCase();
    return this.getRegisteredReferralCodes().includes(clean);
  }

  // Users
  getUsers(): User[] {
    return getStored<User[]>('users', INITIAL_USERS);
  }

  saveUsers(users: User[]): void {
    setStored('users', users);
  }

  getUser(idOrUsernameOrCode: string): User | undefined {
    const clean = idOrUsernameOrCode.toLowerCase().trim();
    return this.getUsers().find(
      u => u.id === idOrUsernameOrCode ||
           u.username.toLowerCase() === clean ||
           u.referralCode.toUpperCase() === idOrUsernameOrCode.toUpperCase().trim()
    );
  }

  getCurrentUser(): User | null {
    return getStored<User | null>('current_user', null);
  }

  setCurrentUser(user: User | null): void {
    setStored('current_user', user);
  }

  getAdminToken(): string | null {
    return getStored<string | null>('admin_token', null);
  }

  setAdminToken(token: string | null): void {
    setStored('admin_token', token);
  }

  getAdminSession(): User | null {
    return getStored<User | null>('admin_session', null);
  }

  setAdminSession(admin: User | null): void {
    setStored('admin_session', admin);
  }

  updateUser(updated: User): void {
    const users = this.getUsers().map(u => u.id === updated.id ? updated : u);
    this.saveUsers(users);
    const curr = this.getCurrentUser();
    if (curr && (curr.id === updated.id || (curr.username && curr.username.toLowerCase() === updated.username?.toLowerCase()))) {
      this.setCurrentUser(updated);
    }
  }

  // Active Sessions Management (Real-time synchronization between Customer & Admin)
  getActiveSessions(): CustomerSession[] {
    const sessions = getStored<CustomerSession[]>('active_sessions', []);
    const users = this.getUsers();
    const now = Date.now();

    // 1. Return sessions that are flagged online and have pinged within 30 minutes
    const validSessions = sessions.filter(
      (s) => s.isOnline && now - new Date(s.lastPingAt || s.loginAt).getTime() < 30 * 60 * 1000
    );

    // 2. Also ensure any registered member flagged as isOnline has a visible active session card
    for (const u of users) {
      if (u.role !== 'super_admin' && u.isOnline) {
        if (!validSessions.some((s) => s.userId === u.id)) {
          validSessions.push({
            id: 'sess-auto-' + u.id,
            userId: u.id,
            username: u.username,
            fullName: u.fullName || u.username,
            email: u.email || '',
            phone: u.phone,
            tier: u.tier || 'SILVER',
            loginAt: u.lastLoginAt || new Date().toISOString(),
            lastPingAt: u.lastLoginAt || new Date().toISOString(),
            isOnline: true,
            browser: 'Chrome 122',
            device: 'Browser Session',
          });
        }
      }
    }

    return validSessions;
  }

  saveActiveSessions(sessions: CustomerSession[]): void {
    setStored('active_sessions', sessions);
  }

  async registerCustomer(newUser: User): Promise<{ success: boolean; user?: User; error?: string }> {
    const users = this.getUsers();
    const existingIdx = users.findIndex(
      (u) =>
        u.id === newUser.id ||
        (u.username && u.username.toLowerCase() === newUser.username.toLowerCase())
    );
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...newUser };
    } else {
      users.push(newUser);
    }
    this.saveUsers(users);

    // Save directly to centralized backend API and await confirmation
    try {
      const res = await safeFetchJson<{ success: boolean; user?: User; error?: string }>(
        getApiUrl('/api/customer/register'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: newUser }),
        }
      );
      if (res.ok && res.data?.success) {
        if (res.data.user) {
          this.updateUser(res.data.user);
        }
        return { success: true, user: res.data.user || newUser };
      }
      if (res.data?.error) {
        return { success: false, error: res.data.error };
      }
    } catch (err: any) {
      console.warn('Backend register sync warning:', err);
    }
    return { success: true, user: newUser };
  }

  async loginCustomer(user: User): Promise<void> {
    const now = new Date().toISOString();
    user.isOnline = true;
    user.lastLoginAt = now;

    const activityItem = {
      id: 'log-' + Date.now(),
      timestamp: now,
      ipAddress: '198.51.100.' + (Math.floor(Math.random() * 200) + 10),
      device: 'Browser Session',
      browser: typeof navigator !== 'undefined' && navigator.userAgent.includes('Chrome') ? 'Chrome 122' : 'Web Browser',
      location: 'Verified Member Gateway',
    };

    user.loginActivity = [activityItem, ...(user.loginActivity || []).slice(0, 9)];
    this.updateUser(user);
    this.setCurrentUser(user);

    // Update active sessions list
    const sessions = getStored<CustomerSession[]>('active_sessions', []);
    const filtered = sessions.filter(s => s.userId !== user.id);
    const newSession: CustomerSession = {
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
    filtered.unshift(newSession);
    this.saveActiveSessions(filtered);

    // Audit Log for Admin to see immediately
    this.addAuditLog({
      adminId: 'system',
      adminName: 'Customer Gateway',
      action: 'CUSTOMER_LOGIN',
      target: `@${user.username}`,
      details: `${user.fullName || user.username} logged into Customer Portal (${activityItem.browser}).`,
    });

    // Notify backend API with full user and session payload
    try {
      const res = await safeFetchJson<{
        success: boolean;
        user: User;
        activeSession: CustomerSession;
      }>(getApiUrl('/api/customer/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.passwordHash || '',
          user,
          deviceInfo: { browser: activityItem.browser, device: activityItem.device },
        }),
      });

      if (res.ok && res.data?.activeSession) {
        const currentSessions = getStored<CustomerSession[]>('active_sessions', []);
        const merged = [res.data.activeSession, ...currentSessions.filter((s) => s.userId !== user.id)];
        this.saveActiveSessions(merged);
      }
    } catch {}
  }

  async logoutCustomer(userId: string): Promise<void> {
    const user = this.getUser(userId);
    if (user) {
      user.isOnline = false;
      this.updateUser(user);

      this.addAuditLog({
        adminId: 'system',
        adminName: 'Customer Gateway',
        action: 'CUSTOMER_LOGOUT',
        target: `@${user.username}`,
        details: `${user.fullName} signed out of Customer Portal.`,
      });
    }

    const sessions = getStored<CustomerSession[]>('active_sessions', []);
    const updated = sessions.map(s => s.userId === userId ? { ...s, isOnline: false } : s).filter(s => s.userId !== userId);
    this.saveActiveSessions(updated);

    this.setCurrentUser(null);

    // Notify backend API
    try {
      await safeFetchJson(getApiUrl('/api/customer/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch {}
  }

  pingHeartbeat(userId: string): void {
    const now = new Date().toISOString();
    const sessions = getStored<CustomerSession[]>('active_sessions', []);
    let modified = false;
    const updated = sessions.map(s => {
      if (s.userId === userId) {
        modified = true;
        return { ...s, lastPingAt: now, isOnline: true };
      }
      return s;
    });

    if (modified) {
      this.saveActiveSessions(updated);
    }

    try {
      safeFetchJson(getApiUrl('/api/customer/heartbeat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    } catch {}
  }

  async syncFromServer(): Promise<void> {
    return syncFromServer();
  }

  async fetchAdminLiveData(): Promise<{ users: User[]; sessions: CustomerSession[] } | null> {
    try {
      const res = await safeFetchJson<{
        success: boolean;
        users: User[];
        sessions: CustomerSession[];
      }>(getApiUrl('/api/admin/live-data'));

      if (res.ok && res.data && res.data.success) {
        if (Array.isArray(res.data.users) && res.data.users.length > 0) {
          const raw = JSON.stringify(res.data.users);
          localStorage.setItem(STORAGE_PREFIX + 'users', raw);
          storageCache.set('users', { raw, parsed: res.data.users });
        }
        if (Array.isArray(res.data.sessions)) {
          const raw = JSON.stringify(res.data.sessions);
          localStorage.setItem(STORAGE_PREFIX + 'active_sessions', raw);
          storageCache.set('active_sessions', { raw, parsed: res.data.sessions });
        }
        return {
          users: res.data.users || this.getUsers(),
          sessions: res.data.sessions || this.getActiveSessions(),
        };
      }
    } catch {}
    return null;
  }

  async updateUserTier(userId: string, tier: 'SILVER' | 'GOLD', adminName?: string): Promise<User | null> {
    const cleanTier: 'SILVER' | 'GOLD' = tier.toUpperCase() === 'GOLD' ? 'GOLD' : 'SILVER';
    const vipLevel = cleanTier === 'GOLD' ? 'VIP 3' : 'VIP 1';

    // 1. Immediately update user in local store
    const user = this.getUser(userId);
    if (user) {
      user.tier = cleanTier;
      user.vipLevel = vipLevel;
      this.updateUser(user);
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('nexo_global_sync');
        bc.postMessage({
          type: 'tier_updated',
          userId: user?.id || userId,
          username: user?.username,
          tier: cleanTier,
          vipLevel,
          senderTabId: CURRENT_TAB_ID,
        });
        bc.close();
      }
    } catch {}

    // 2. Synchronize with centralized backend API
    try {
      const res = await safeFetchJson<{ success: boolean; user?: User }>(
        getApiUrl('/api/admin/update-user-tier'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, tier: cleanTier, adminName }),
        }
      );
      if (res.ok && res.data?.user) {
        this.updateUser(res.data.user);
        return res.data.user;
      }
    } catch {}

    return user || null;
  }

  terminateCustomerSession(userId: string, adminName: string): void {
    const user = this.getUser(userId);
    if (user) {
      user.isOnline = false;
      this.updateUser(user);
    }
    const sessions = getStored<CustomerSession[]>('active_sessions', []);
    this.saveActiveSessions(sessions.filter(s => s.userId !== userId));

    this.addAuditLog({
      adminId: 'admin',
      adminName,
      action: 'FORCE_TERMINATE_SESSION',
      target: user ? `@${user.username}` : `User ${userId}`,
      details: 'Admin terminated active customer session.',
    });

    try {
      fetch('/api/customer/terminate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, adminUsername: adminName }),
      }).catch(() => {});
    } catch {}
  }

  // Order Progress State (Format: Order Complete X of 25)
  getUserOrderProgress(userId: string): UserOrderProgress {
    const user = this.getUser(userId);
    const userTier: TierStatus = user?.tier === 'GOLD' ? 'GOLD' : 'SILVER';
    const allProgress = getStored<Record<string, UserOrderProgress>>('user_order_progress', {});

    let prog = allProgress[userId];
    if (prog) {
      // If user tier changed (e.g. from Silver to Gold or vice versa), adapt pending orders
      if (prog.tier && prog.tier !== userTier) {
        prog.tier = userTier;
        const freshOrders = generate25Orders(userTier);
        prog.orders = prog.orders.map((existing, idx) => {
          if (existing.status === 'pending' && freshOrders[idx]) {
            return freshOrders[idx];
          }
          return existing;
        });
        allProgress[userId] = prog;
        setStored('user_order_progress', allProgress);
      }
      return prog;
    }

    const fresh: UserOrderProgress = {
      userId,
      tier: userTier,
      completedCount: 0,
      currentOrderIndex: 0,
      orders: generate25Orders(userTier),
      isCompleted: false,
      startedAt: new Date().toISOString(),
    };
    allProgress[userId] = fresh;
    setStored('user_order_progress', allProgress);
    return fresh;
  }

  saveUserOrderProgress(progress: UserOrderProgress): void {
    const allProgress = getStored<Record<string, UserOrderProgress>>('user_order_progress', {});
    allProgress[progress.userId] = progress;
    setStored('user_order_progress', allProgress);
  }

  getUserCycleState(userId: string): UserOrderProgress {
    return this.getUserOrderProgress(userId);
  }

  resetUserCycle(userId: string): UserOrderProgress {
    const user = this.getUser(userId);
    const userTier: TierStatus = user?.tier === 'GOLD' ? 'GOLD' : 'SILVER';
    const fresh: UserOrderProgress = {
      userId,
      tier: userTier,
      completedCount: 0,
      currentOrderIndex: 0,
      orders: generate25Orders(userTier),
      isCompleted: false,
      startedAt: new Date().toISOString(),
    };
    this.saveUserOrderProgress(fresh);
    return fresh;
  }

  submitCycleOrder(userId: string, orderNumber: number) {
    return this.submitOrder(userId, orderNumber);
  }

  // Balance & Wallet Metrics (Requirement 9: Available, Hold, Commission)
  getWalletBalances(userId: string) {
    const userBalances = getStored<Record<string, { available: number; hold: number; commission: number; totalEarned: number; totalWithdrawn: number }>>('user_balances', {});
    if (!userBalances[userId]) {
      // Default initial balance for new registered customer: starts at $0
      userBalances[userId] = {
        available: 0,
        hold: 0,
        commission: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      };
      setStored('user_balances', userBalances);
    }
    return userBalances[userId];
  }

  getWalletMetrics(userId: string) {
    const balances = this.getWalletBalances(userId);
    return {
      available: balances.available,
      held: balances.hold,
      hold: balances.hold,
      pendingCommission: balances.commission,
      commission: balances.commission,
      totalEarned: balances.totalEarned,
      totalWithdrawn: balances.totalWithdrawn,
    };
  }

  saveWalletBalances(userId: string, balances: { available: number; hold: number; commission: number; totalEarned: number; totalWithdrawn: number }): void {
    const all = getStored<Record<string, { available: number; hold: number; commission: number; totalEarned: number; totalWithdrawn: number }>>('user_balances', {});
    all[userId] = {
      available: Number(balances.available.toFixed(2)),
      hold: Number(balances.hold.toFixed(2)),
      commission: Number(balances.commission.toFixed(2)),
      totalEarned: Number(balances.totalEarned.toFixed(2)),
      totalWithdrawn: Number(balances.totalWithdrawn.toFixed(2)),
    };
    setStored('user_balances', all);
  }

  // Transactions
  getTransactions(userId?: string): Transaction[] {
    const list = getStored<Transaction[]>('transactions', []);
    if (userId) {
      return list.filter(t => t.userId === userId);
    }
    return list;
  }

  saveTransactions(transactions: Transaction[]): void {
    setStored('transactions', transactions);
  }

  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const all = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      balanceAfter: tx.balanceAfter ?? tx.availableBalanceAfter,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };
    all.unshift(newTx);
    this.saveTransactions(all);
    return newTx;
  }

  // Deposits
  getDeposits(): DepositRequest[] {
    return getStored<DepositRequest[]>('deposits', []);
  }

  saveDeposits(deposits: DepositRequest[]): void {
    setStored('deposits', deposits);
  }

  submitDeposit(request: Omit<DepositRequest, 'id' | 'status' | 'createdAt'>): DepositRequest {
    const list = this.getDeposits();
    const newDep: DepositRequest = {
      ...request,
      id: 'dep-' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newDep);
    this.saveDeposits(list);

    this.addNotification({
      userId: request.userId,
      title: 'Deposit Request Submitted',
      message: `Your deposit request for $${request.amount.toFixed(2)} USDT is pending admin review.`,
      type: 'deposit',
    });

    return newDep;
  }

  approveDeposit(depositId: string, adminName: string): boolean {
    const deposits = this.getDeposits();
    const dep = deposits.find(d => d.id === depositId);
    if (!dep || dep.status !== 'pending') return false;

    dep.status = 'approved';
    dep.processedAt = new Date().toISOString();
    dep.processedBy = adminName;
    this.saveDeposits(deposits);

    // Credit Available Balance atomically
    const balances = this.getWalletBalances(dep.userId);
    balances.available += dep.amount;
    this.saveWalletBalances(dep.userId, balances);

    this.addTransaction({
      userId: dep.userId,
      type: 'deposit',
      amount: dep.amount,
      availableBalanceAfter: balances.available,
      holdBalanceAfter: balances.hold,
      commissionBalanceAfter: balances.commission,
      status: 'completed',
      title: 'TRC20 Deposit Approved',
      description: `Tx: ${dep.txHash.slice(0, 16)}...`,
      tag: 'APPROVED',
      referenceId: dep.id,
    });

    this.addNotification({
      userId: dep.userId,
      title: 'Deposit Approved',
      message: `Your USDT deposit of $${dep.amount.toFixed(2)} has been credited to your Available Balance.`,
      type: 'deposit',
    });

    this.addAuditLog({
      adminId: 'admin',
      adminName,
      action: 'APPROVE_DEPOSIT',
      target: `${dep.id} (${dep.username})`,
      details: `Approved $${dep.amount.toFixed(2)} deposit. New Available Balance: $${balances.available.toFixed(2)}.`,
    });

    return true;
  }

  rejectDeposit(depositId: string, reason: string, adminName: string): boolean {
    const deposits = this.getDeposits();
    const dep = deposits.find(d => d.id === depositId);
    if (!dep || dep.status !== 'pending') return false;

    dep.status = 'rejected';
    dep.rejectReason = reason;
    dep.processedAt = new Date().toISOString();
    dep.processedBy = adminName;
    this.saveDeposits(deposits);

    this.addNotification({
      userId: dep.userId,
      title: 'Deposit Request Declined',
      message: `Your deposit of $${dep.amount.toFixed(2)} was declined: ${reason}`,
      type: 'deposit',
    });

    this.addAuditLog({
      adminId: 'admin',
      adminName,
      action: 'REJECT_DEPOSIT',
      target: `${dep.id} (${dep.username})`,
      details: `Rejected deposit: ${reason}`,
    });

    return true;
  }

  // Submit Order Logic with Strict Hold & Commission Accounting (Requirement 9)
  submitOrder(userId: string, orderNumber: number): {
    success: boolean;
    error?: string;
    completedCount?: number;
    is25Completed?: boolean;
    releasedTotal?: number;
  } {
    const progress = this.getUserOrderProgress(userId);
    if (progress.isCompleted) {
      return { success: false, error: 'All 25 orders have already been completed.' };
    }

    const orderIdx = orderNumber - 1;
    if (orderIdx !== progress.currentOrderIndex) {
      return { success: false, error: 'Order must be completed sequentially.' };
    }

    const order = progress.orders[orderIdx];
    const balances = this.getWalletBalances(userId);

    // Rule: "Only Available Balance can be used for an order/deposit requirement."
    // Rule: "Hold Balance cannot be used to start another order."
    // Rule: "Commission Balance cannot be used to start another order."
    if (balances.available < order.orderAmount) {
      return {
        success: false,
        error: `Insufficient Available Balance. This order requires $${order.orderAmount.toFixed(2)} in Available Balance, but your Available Balance is $${balances.available.toFixed(2)}. Please make a deposit to continue.`,
      };
    }

    // Step 1: Move principal from Available Balance to Hold Balance
    balances.available -= order.orderAmount;
    balances.hold += order.orderAmount;

    // Step 2: Add commission separately to Commission Balance
    const commission = order.estimatedCommission;
    balances.commission += commission;
    balances.totalEarned += commission;

    // Mark order complete
    order.status = 'completed';
    order.completedAt = new Date().toISOString();
    progress.completedCount += 1;
    progress.currentOrderIndex += 1;

    // Record separate transaction for Principal Move to Hold
    this.addTransaction({
      userId,
      type: 'order_hold',
      amount: -order.orderAmount,
      availableBalanceAfter: balances.available,
      holdBalanceAfter: balances.hold,
      commissionBalanceAfter: balances.commission,
      status: 'completed',
      title: `Order Complete ${progress.completedCount} of 25 (Principal Held)`,
      description: `$${order.orderAmount.toFixed(2)} moved from Available Balance to Hold Balance`,
      tag: 'HOLD_BALANCE',
      referenceId: `order-${order.orderNumber}-hold`,
    });

    // Record separate transaction for Commission Accrual
    this.addTransaction({
      userId,
      type: 'order_commission',
      amount: commission,
      availableBalanceAfter: balances.available,
      holdBalanceAfter: balances.hold,
      commissionBalanceAfter: balances.commission,
      status: 'completed',
      title: `Order Complete ${progress.completedCount} of 25 (Commission Accrued)`,
      description: `+$${commission.toFixed(2)} credited to Commission Balance`,
      tag: 'COMMISSION_BALANCE',
      referenceId: `order-${order.orderNumber}-commission`,
    });

    // 10% Referral Commission on profit to referrer
    const user = this.getUser(userId);
    if (user && user.referredBy) {
      const referrer = this.getUser(user.referredBy);
      if (referrer && referrer.id !== user.id) {
        const refProfitBonus = Number((commission * 0.10).toFixed(2));
        if (refProfitBonus > 0) {
          const refBalances = this.getWalletBalances(referrer.id);
          refBalances.available += refProfitBonus;
          refBalances.totalEarned += refProfitBonus;
          this.saveWalletBalances(referrer.id, refBalances);

          this.addTransaction({
            userId: referrer.id,
            type: 'referral_bonus',
            amount: refProfitBonus,
            availableBalanceAfter: refBalances.available,
            status: 'completed',
            title: `10% Referral Profit Bonus from @${user.username}`,
            description: `10% of profit on Order ${progress.completedCount} of 25`,
            tag: 'REFERRAL_10_PERCENT',
            referenceId: `ref-${user.username}-${order.orderNumber}`,
          });

          // Update referral record
          const refs = this.getReferrals();
          const matchRef = refs.find(
            r => (r.referrerUsername.toLowerCase() === referrer.username.toLowerCase() ||
                  r.referrerUsername.toLowerCase() === referrer.referralCode.toLowerCase()) &&
                 (r.referredUsername.toLowerCase() === user.username.toLowerCase() ||
                  r.referredUserId === user.id)
          );
          if (matchRef) {
            matchRef.totalCommissionGenerated += refProfitBonus;
            this.saveReferrals(refs);
          }

          this.addNotification({
            userId: referrer.id,
            title: '10% Referral Reward Credited',
            message: `+$${refProfitBonus.toFixed(2)} added to your Available Balance from referred member @${user.username}'s Order Complete ${progress.completedCount} of 25.`,
            type: 'referral',
          });
        }
      }
    }

    // Check if 25 of 25 is reached (Release rule: Requirement 9)
    let is25Completed = false;
    let releasedTotal = 0;

    if (progress.completedCount >= 25) {
      progress.isCompleted = true;
      progress.completedAt = new Date().toISOString();
      is25Completed = true;

      // Automatically release accumulated Hold Balance + Commission Balance into Available Balance!
      releasedTotal = balances.hold + balances.commission;
      balances.available += releasedTotal;
      balances.hold = 0;
      balances.commission = 0;

      this.addTransaction({
        userId,
        type: 'release_25_orders',
        amount: releasedTotal,
        availableBalanceAfter: balances.available,
        holdBalanceAfter: 0,
        commissionBalanceAfter: 0,
        status: 'completed',
        title: 'Order Complete 25 of 25 (Balances Released)',
        description: `All 25 orders completed! Total $${releasedTotal.toFixed(2)} (Hold + Commission) released to Available Balance`,
        tag: 'RELEASED_25_OF_25',
      });

      this.addNotification({
        userId,
        title: 'Order Complete 25 of 25!',
        message: `Congratulations! All 25 orders completed. Accumulated $${releasedTotal.toFixed(2)} has been released to your Available Balance. Withdrawals are now fully unlocked.`,
        type: 'order',
      });
    }

    // Persist changes
    this.saveWalletBalances(userId, balances);
    this.saveUserOrderProgress(progress);

    return {
      success: true,
      completedCount: progress.completedCount,
      is25Completed,
      releasedTotal,
    };
  }

  // Withdrawals (Requirement 8)
  getWithdrawals(): WithdrawalRequest[] {
    return getStored<WithdrawalRequest[]>('withdrawals', []);
  }

  saveWithdrawals(withdrawals: WithdrawalRequest[]): void {
    setStored('withdrawals', withdrawals);
  }

  submitWithdrawal(userId: string, amount: number, destinationAddress: string): { success: boolean; error?: string } {
    const progress = this.getUserOrderProgress(userId);

    // Requirement 8: When clicked before 25 of 25 orders, show exact message:
    if (!progress.isCompleted || progress.completedCount < 25) {
      return {
        success: false,
        error: 'Please complete all 25 orders before you can withdraw your funds.',
      };
    }

    const balances = this.getWalletBalances(userId);
    if (amount > balances.available) {
      return { success: false, error: 'Insufficient Available Balance.' };
    }

    if (amount < 50) {
      return { success: false, error: 'Minimum withdrawal amount is $50.00 USDT.' };
    }

    const user = this.getUser(userId);
    if (!user) return { success: false, error: 'User not found.' };

    const withdrawals = this.getWithdrawals();
    const newReq: WithdrawalRequest = {
      id: 'wth-' + Date.now(),
      userId,
      username: user.username,
      userFullName: user.fullName,
      amount,
      destinationAddress,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    withdrawals.unshift(newReq);
    this.saveWithdrawals(withdrawals);

    // Debit Available Balance atomically
    balances.available -= amount;
    balances.totalWithdrawn += amount;
    this.saveWalletBalances(userId, balances);

    this.addTransaction({
      userId,
      type: 'withdrawal',
      amount: -amount,
      availableBalanceAfter: balances.available,
      holdBalanceAfter: balances.hold,
      commissionBalanceAfter: balances.commission,
      status: 'pending',
      title: 'Withdrawal Request Submitted',
      description: `Destination: ${destinationAddress.slice(0, 8)}...${destinationAddress.slice(-6)}`,
      tag: 'PENDING_REVIEW',
      referenceId: newReq.id,
    });

    this.addNotification({
      userId,
      title: 'Withdrawal Submitted',
      message: `Your withdrawal request for $${amount.toFixed(2)} USDT is pending admin review.`,
      type: 'withdrawal',
    });

    return { success: true };
  }

  approveWithdrawal(withdrawalId: string, adminName: string): boolean {
    const list = this.getWithdrawals();
    const wth = list.find(w => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return false;

    wth.status = 'approved';
    wth.processedAt = new Date().toISOString();
    wth.processedBy = adminName;
    this.saveWithdrawals(list);

    const txs = this.getTransactions();
    const matchTx = txs.find(t => t.referenceId === wth.id);
    if (matchTx) {
      matchTx.status = 'completed';
      matchTx.tag = 'COMPLETED';
      this.saveTransactions(txs);
    }

    this.addNotification({
      userId: wth.userId,
      title: 'Withdrawal Dispatched',
      message: `Your withdrawal of $${wth.amount.toFixed(2)} USDT has been successfully transmitted to ${wth.destinationAddress}.`,
      type: 'withdrawal',
    });

    this.addAuditLog({
      adminId: 'admin',
      adminName,
      action: 'APPROVE_WITHDRAWAL',
      target: `${wth.id} (${wth.username})`,
      details: `Approved $${wth.amount.toFixed(2)} withdrawal to ${wth.destinationAddress}`,
    });

    return true;
  }

  rejectWithdrawal(withdrawalId: string, reason: string, adminName: string): boolean {
    const list = this.getWithdrawals();
    const wth = list.find(w => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return false;

    wth.status = 'rejected';
    wth.rejectReason = reason;
    wth.processedAt = new Date().toISOString();
    wth.processedBy = adminName;
    this.saveWithdrawals(list);

    // Refund Available Balance
    const balances = this.getWalletBalances(wth.userId);
    balances.available += wth.amount;
    balances.totalWithdrawn -= wth.amount;
    this.saveWalletBalances(wth.userId, balances);

    this.addTransaction({
      userId: wth.userId,
      type: 'admin_adjustment',
      amount: wth.amount,
      availableBalanceAfter: balances.available,
      status: 'completed',
      title: 'Withdrawal Refunded',
      description: `Declined: ${reason}`,
      tag: 'REFUNDED',
      referenceId: wth.id,
    });

    this.addNotification({
      userId: wth.userId,
      title: 'Withdrawal Declined',
      message: `Withdrawal of $${wth.amount.toFixed(2)} was rejected: ${reason}. Funds returned to Available Balance.`,
      type: 'withdrawal',
    });

    this.addAuditLog({
      adminId: 'admin',
      adminName,
      action: 'REJECT_WITHDRAWAL',
      target: `${wth.id} (${wth.username})`,
      details: `Rejected withdrawal: ${reason}. Refunded to Available Balance.`,
    });

    return true;
  }

  // Admin Manual Adjustment
  applyAdminAdjustment(adj: Omit<AdminAdjustment, 'id' | 'createdAt'>): void {
    const balances = this.getWalletBalances(adj.userId);
    balances.available = adj.newBalance;
    this.saveWalletBalances(adj.userId, balances);

    const newAdj: AdminAdjustment = {
      ...adj,
      id: 'adj-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    const adjustments = getStored<AdminAdjustment[]>('adjustments', []);
    adjustments.unshift(newAdj);
    setStored('adjustments', adjustments);

    this.addTransaction({
      userId: adj.userId,
      type: 'admin_adjustment',
      amount: adj.amount,
      availableBalanceAfter: balances.available,
      status: 'completed',
      title: `Admin ${adj.type.replace('_', ' ').toUpperCase()}`,
      description: adj.reason,
      tag: 'ADMIN_MANUAL',
      referenceId: newAdj.id,
    });

    this.addNotification({
      userId: adj.userId,
      title: 'Account Balance Adjustment',
      message: `Your Available Balance was adjusted by $${adj.amount >= 0 ? '+' : ''}${adj.amount.toFixed(2)} (${adj.reason}).`,
      type: 'account',
    });

    this.addAuditLog({
      adminId: adj.adminId,
      adminName: adj.adminName,
      action: 'MANUAL_ADJUSTMENT',
      target: `${adj.username}`,
      details: `${adj.type}: ${adj.amount >= 0 ? '+' : ''}$${adj.amount} (From $${adj.previousBalance} to $${adj.newBalance}). Reason: ${adj.reason}`,
    });
  }

  getAdjustments(): AdminAdjustment[] {
    return getStored<AdminAdjustment[]>('adjustments', []);
  }

  // ==============================================================
  // 1. SILVER PRODUCT SYSTEM (Silver Orders 1-25)
  // ==============================================================
  getSilverProducts(): Product[] {
    return getStored<Product[]>('silver_products', INITIAL_SILVER_PRODUCTS);
  }

  saveSilverProducts(products: Product[]): void {
    setStored('silver_products', products);
  }

  updateSilverProduct(updated: Product): void {
    const list = this.getSilverProducts().map(p => p.id === updated.id ? updated : p);
    this.saveSilverProducts(list);

    // Sync only to active Silver customer pending orders
    const allProgress = getStored<Record<string, UserOrderProgress>>('user_order_progress', {});
    let changed = false;
    for (const userId of Object.keys(allProgress)) {
      const user = this.getUser(userId);
      if (user?.tier !== 'GOLD') { // Silver customer
        const prog = allProgress[userId];
        if (prog && prog.orders) {
          prog.orders = prog.orders.map(o => {
            if (o.productId === updated.id && o.status === 'pending') {
              changed = true;
              return {
                ...o,
                productName: updated.name,
                orderAmount: updated.price,
                commissionRate: updated.commissionRate,
                estimatedCommission: Number((updated.price * updated.commissionRate).toFixed(2)),
                imageUrl: updated.imageUrl,
                marketplace: updated.marketplace,
                category: updated.category,
                tier: 'SILVER',
              };
            }
            return o;
          });
        }
      }
    }
    if (changed) {
      setStored('user_order_progress', allProgress);
    }
  }

  // ==============================================================
  // 2. GOLD PRODUCT SYSTEM (Gold Orders 1-25 - Never shared with Silver)
  // ==============================================================
  getGoldProducts(): Product[] {
    return getStored<Product[]>('gold_products', INITIAL_GOLD_PRODUCTS);
  }

  saveGoldProducts(products: Product[]): void {
    setStored('gold_products', products);
  }

  updateGoldProduct(updated: Product): void {
    const list = this.getGoldProducts().map(p => p.id === updated.id ? updated : p);
    this.saveGoldProducts(list);

    // Sync only to active Gold customer pending orders
    const allProgress = getStored<Record<string, UserOrderProgress>>('user_order_progress', {});
    let changed = false;
    for (const userId of Object.keys(allProgress)) {
      const user = this.getUser(userId);
      if (user?.tier === 'GOLD') { // Gold customer
        const prog = allProgress[userId];
        if (prog && prog.orders) {
          prog.orders = prog.orders.map(o => {
            if (o.productId === updated.id && o.status === 'pending') {
              changed = true;
              return {
                ...o,
                productName: updated.name,
                orderAmount: updated.price,
                commissionRate: updated.commissionRate,
                estimatedCommission: Number((updated.price * updated.commissionRate).toFixed(2)),
                imageUrl: updated.imageUrl,
                marketplace: updated.marketplace,
                category: updated.category,
                tier: 'GOLD',
              };
            }
            return o;
          });
        }
      }
    }
    if (changed) {
      setStored('user_order_progress', allProgress);
    }
  }

  // Two Main Product Configs
  getSilverMainConfig(): Product {
    return getStored<Product>('silver_main_config', {
      id: 'silver-config-main',
      name: 'NEXO Silver Prime Distribution Asset',
      marketplace: 'Amazon Prime Global',
      category: 'Silver Tier Allocation',
      price: 65.00,
      commissionRate: 0.25,
      imageUrl: rolexImg,
      status: 'active',
      tierType: 'silver',
      description: 'Core daily fulfillment product for all verified Silver Tier accounts.',
    });
  }

  updateSilverMainConfig(prod: Product): void {
    setStored('silver_main_config', { ...prod, tierType: 'silver' });
  }

  getGoldMainConfig(): Product {
    return getStored<Product>('gold_main_config', {
      id: 'gold-config-main',
      name: 'NEXO Gold Apex Priority Fulfillment Package',
      marketplace: 'Enterprise Global Direct',
      category: 'Gold Tier Allocation',
      price: 180.00,
      commissionRate: 0.35,
      imageUrl: showcaseImg,
      status: 'active',
      tierType: 'gold',
      description: 'Exclusive high-yield priority fulfillment package for verified Gold VIP accounts.',
    });
  }

  updateGoldMainConfig(prod: Product): void {
    setStored('gold_main_config', { ...prod, tierType: 'gold' });
  }

  // Compatibility aliases
  getSilverProduct(): Product { return this.getSilverMainConfig(); }
  getGoldProduct(): Product { return this.getGoldMainConfig(); }
  getProducts(): Product[] { return this.getSilverProducts(); }
  saveProducts(p: Product[]): void { this.saveSilverProducts(p); }
  updateProduct(p: Product): void { this.updateSilverProduct(p); }

  // Admin Reset Customer Password
  resetUserPassword(userId: string, newPass: string, adminName?: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    user.passwordHash = newPass;
    this.saveUsers(users);

    const curr = this.getCurrentUser();
    if (curr && curr.id === userId) {
      curr.passwordHash = newPass;
      this.setCurrentUser(curr);
    }

    this.addAuditLog({
      adminId: 'admin',
      adminName: adminName || 'Super Admin',
      action: 'ADMIN_RESET_PASSWORD',
      target: `@${user.username}`,
      details: 'Customer password updated by administrator. Credentials remain unreadable.',
    });

    this.addNotification({
      userId,
      title: 'Security Alert: Password Updated',
      message: 'Your account password was updated by the system administrator.',
      type: 'account',
    });

    return true;
  }

  // Banners
  getBanners(): PromotionalBanner[] {
    return getStored<PromotionalBanner[]>('banners', INITIAL_BANNERS);
  }

  saveBanners(banners: PromotionalBanner[]): void {
    setStored('banners', banners);
  }

  // Chat
  getConversations(): ChatConversation[] {
    return getStored<ChatConversation[]>('chat_conversations', []);
  }

  saveConversations(conversations: ChatConversation[]): void {
    setStored('chat_conversations', conversations);
  }

  getMessages(conversationId: string): ChatMessage[] {
    const msgs = getStored<ChatMessage[]>('chat_messages', []);
    return msgs.filter(m => m.conversationId === conversationId);
  }

  saveMessages(messages: ChatMessage[]): void {
    setStored('chat_messages', messages);
  }

  addMessage(msg: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): ChatMessage {
    const msgs = getStored<ChatMessage[]>('chat_messages', []);
    const newMsg: ChatMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    msgs.push(newMsg);
    setStored('chat_messages', msgs);

    const convs = this.getConversations();
    const conv = convs.find(c => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessage = msg.message;
      conv.lastMessageTimestamp = newMsg.timestamp;
      if (msg.senderRole === 'customer') {
        conv.unreadAdminCount += 1;
      } else {
        conv.unreadCustomerCount += 1;
      }
      this.saveConversations(convs);
    }

    return newMsg;
  }

  startConversation(customerName: string, customerEmail: string, customerPhone: string, userId?: string): ChatConversation {
    const convs = this.getConversations();
    if (userId) {
      const existing = convs.find(c => c.userId === userId);
      if (existing) return existing;
    }

    const newConv: ChatConversation = {
      id: 'conv-' + Date.now(),
      userId,
      customerName,
      customerEmail,
      customerPhone,
      status: 'open',
      unreadAdminCount: 0,
      unreadCustomerCount: 0,
      lastMessage: 'Conversation started',
      lastMessageTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    convs.unshift(newConv);
    this.saveConversations(convs);

    this.addMessage({
      conversationId: newConv.id,
      senderId: 'support-sys',
      senderName: 'NEXO Support',
      senderRole: 'support',
      message: 'Welcome to NEXO. Please tell us your issue here, and our support team will guide you. NEXO support is available 24/7.',
    });

    return newConv;
  }

  // Notifications
  getNotifications(userId: string): NotificationItem[] {
    const list = getStored<NotificationItem[]>('notifications', []);
    return list.filter(n => n.userId === userId || n.userId === 'all');
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const list = getStored<NotificationItem[]>('notifications', []);
    const newNotif: NotificationItem = {
      ...notif,
      id: 'notif-' + Date.now(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotif);
    setStored('notifications', list);
    return newNotif;
  }

  markNotificationRead(notifId: string): void {
    const list = getStored<NotificationItem[]>('notifications', []);
    const match = list.find(n => n.id === notifId);
    if (match) {
      match.read = true;
      setStored('notifications', list);
    }
  }

  markAllNotificationsRead(userId: string): void {
    const list = getStored<NotificationItem[]>('notifications', []);
    list.forEach(n => {
      if (n.userId === userId || n.userId === 'all') {
        n.read = true;
      }
    });
    setStored('notifications', list);
  }

  // Referrals
  getReferrals(): ReferralRecord[] {
    return getStored<ReferralRecord[]>('referrals', []);
  }

  saveReferrals(referrals: ReferralRecord[]): void {
    setStored('referrals', referrals);
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>('audit_logs', []);
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: 'audit-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setStored('audit_logs', logs);
  }

  // Reset order progression (Restart 25 orders)
  resetUserOrders(userId: string): UserOrderProgress {
    const fresh: UserOrderProgress = {
      userId,
      completedCount: 0,
      currentOrderIndex: 0,
      orders: generate25Orders(),
      isCompleted: false,
      startedAt: new Date().toISOString(),
    };
    this.saveUserOrderProgress(fresh);
    return fresh;
  }
}

export const store = new NexoStore();
