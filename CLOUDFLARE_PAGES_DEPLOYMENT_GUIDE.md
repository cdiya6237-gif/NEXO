# ☁️ NEXO — Cloudflare Pages & Full-Stack Deployment Guide

Welcome to the deployment guide for **NEXO Next Experience Commerce Opportunity**.

---

## 🌟 1. Architecture Overview

NEXO is designed with a **unified backend architecture**:
- **Customer Portal**: E-commerce catalog, orders, VIP levels, commissions, deposit, and customer profile.
- **Admin Control Center**: Customer accounts directory, live sessions, deposit/withdrawal approvals, order cycle tracking, and audit logs.
- **Centralized Shared Backend (`server.ts` + `central_store.json`)**: Real-time business logic, authentication, and Server-Sent Events (SSE) broadcasting.

```text
Customer Portal  ──▶  Shared Central Backend (Express / SSE)  ◀──  Admin Portal
                                  │
                       Shared Database (central_store.json)
```

---

## 🚀 2. Deploying on Cloudflare Pages

Your Cloudflare Pages Project URL:
👉 **`https://dash.cloudflare.com/00645950f9d43da9117c1839f1dd2425/pages/view/httpsnexostore/deployments/new`**

### Step A: Connect Git Repository or Direct Upload
In Cloudflare Pages dashboard:
1. Select **Connect to Git** (GitHub / GitLab) or **Direct Upload**.
2. If using Git, configure the **Build settings**:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist` *(or `dist-customer` / `dist-admin` if deploying separate sites)*
   - **Root directory**: `/` (leave blank)

### Step B: Environment Variables in Cloudflare Pages
Under **Settings > Environment variables > Production**:
Add:
- **`VITE_API_URL`**: The public URL of your centralized backend server (e.g., `https://nexo-backend.onrender.com` or your custom API domain).
  *(If running full-stack on the same domain, leave this empty).*

---

## 🖥️ 3. Deploying the Centralized Backend (Free 1-Click Options)

Because Cloudflare Pages is a static frontend CDN, your persistent central backend (`server.ts`) should run on any Node.js hosting platform:

### Free Option 1: Render.com (Recommended)
1. Go to [render.com](https://render.com) and create a free account.
2. Click **New + > Web Service** and connect this repository.
3. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Copy your live Render URL (e.g., `https://nexo-backend.onrender.com`).
5. In Cloudflare Pages, set `VITE_API_URL = https://nexo-backend.onrender.com`.
6. Done! Both your Cloudflare Customer site and Admin site will communicate with this shared backend.

### Free Option 2: Railway.app / VPS / cPanel
- Run `npm install` and `npm start`.
- The server will listen on port `3000` (or `process.env.PORT`).

---

## 🔄 4. Real-Time Invisible Background Sync

Both panels now feature **Zero-Reload Invisible Background Synchronization**:
1. **No Page Flickering**: When a new customer registers or logs in, the page **never reloads or flickers**.
2. **Server-Sent Events (SSE)**: The backend automatically emits updates to `/api/events` whenever data mutations occur.
3. **Fingerprint State Updates**: The Admin Panel uses deep fingerprint comparison (`lastDataSnapshotRef`). It only re-renders React state when an actual attribute changes, preserving scroll positions, active tabs, and open modals.
4. **Vite Watch Exclusions**: Database writes to `central_store.json` are excluded from Vite's file watcher, eliminating localhost reload loops.

---

## 🔑 5. Administrative Credentials
- **Admin Username:** `Sham`
- **Admin Password:** `sham12$`
*(Stored securely on the backend server; configurable via `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables).*
