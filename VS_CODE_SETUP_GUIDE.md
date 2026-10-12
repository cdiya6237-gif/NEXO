# 🚀 NEXO Platform — Visual Studio Code Setup & Deployment Guide

This repository contains the complete full-stack source code for the **NEXO Next Experience Commerce Opportunity** platform, including both the **Customer Application** and the **Admin Management Control Center**.

---

## 📁 Project Directory Structure
```text
├── database/                   # Relational schema (PostgreSQL/SQLite) and seed data
├── dist/                       # Production bundle distribution directory
├── dist-admin/                 # Admin portal production entry
├── dist-customer/              # Customer portal production entry
├── public/                     # Static assets (favicons, manifest, robots.txt)
├── src/                        # Complete React + TypeScript + Tailwind source code
│   ├── assets/                 # High-resolution image assets
│   ├── components/             # Reusable UI components (Auth, Header, Modals)
│   ├── pages/                  # Application views (Home, Orders, Wallet, Admin Portal)
│   │   └── admin/              # Admin Sidebar, Customer Profiles, Products, Banners
│   ├── services/               # State store, wallet calculation engine, audit logging
│   └── types/                  # TypeScript interface definitions
├── .env.example                # Environment variable configuration template
├── .npmrc                      # NPM engine and package configuration
├── build-portals.mjs           # Multi-portal automated build script
├── firebase-applet-config.json # Firebase cloud deployment parameters
├── firebase-blueprint.json     # Entity schema definitions
├── firestore.rules             # Role-based access control security rules
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and script runner
├── server.ts                   # Express.js backend with administrative authentication
├── start.bat                   # 1-Click launcher for Windows
├── tsconfig.json               # TypeScript compiler rules
└── vite.config.ts              # Vite bundler configuration
```

---

## 🛠️ Requirements
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **NPM**: v9.0.0 or higher (comes with Node.js)
- **Visual Studio Code** ([Download VS Code](https://code.visualstudio.com/))

---

## 💻 Step 1: Open in Visual Studio Code
1. Extract the downloaded `NEXO-Complete-Project.zip` folder on your computer.
2. Open **VS Code**.
3. Click **File > Open Folder...** and select the extracted folder.
4. Open the integrated terminal in VS Code using **Terminal > New Terminal** (or press `` Ctrl + ` ``).

---

## 📦 Step 2: Install Dependencies
Run the following command in the VS Code terminal:
```bash
npm install --legacy-peer-deps
```
*(Or simply `npm install` — the included `.npmrc` file already configures legacy peer resolution automatically).*

---

## ⚙️ Step 3: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
*(On Windows CMD/PowerShell, you can run `copy .env.example .env`)*

---

## 🚀 Step 4: Run Development Server
Start the full-stack server (runs both the Express backend and Vite frontend):
```bash
npm run dev
```
*(Or on Windows, simply double-click `start.bat`)*

Open your browser to:
- **Customer Portal**: [http://localhost:3000](http://localhost:3000)
- **Admin Portal**: [http://localhost:3000/?admin=true](http://localhost:3000/?admin=true) (or right-click the small avatar icon at the absolute bottom-right corner of the customer panel)

---

## 🔐 Administrative Credentials
- **Admin Username**: `Sham`
- **Admin Password**: `sham12$`

---

## 🏗️ Step 5: Production Build & Deployment
To build the distribution for public web hosting:
```bash
npm run build
```
The output will be placed in the `dist/` directory, ready to deploy to services like:
- **Vercel / Netlify**: Connect repository or upload `dist/`.
- **Render / Railway / VPS**: Run `npm install && npm start` (runs `server.ts`).
- **Cloud Run / Docker**: Use standard Node.js Docker container.
