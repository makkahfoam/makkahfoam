# 🛋️ Furniture ERP & Enterprise Business Suite

A production-ready, heavy-design Furniture ERP, Billing, Inventory, Purchasing (Gate In), Vendor Ledger, and Customer Ledger Management System built for multi-profile commercial furniture businesses.

Engineered with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Drizzle ORM**, and **Turso SQLite (LibSQL)** for permanent cloud persistence and zero data loss on Vercel serverless deployments.

---

## 🌟 Key Highlights & Architectural Guarantees

- **Permanent Cloud Persistence (Turso SQLite / LibSQL)**: All business transactions, invoices, and ledgers are permanently stored in Turso. No transient state, no localStorage dependency.
- **Strict Scope Guarantee (Zero Gate Out)**: Gate In (Goods Receiving) handles stock intake cleanly. Per business specification, Gate Out does not exist in the database, API, sidebar, or UI.
- **Smart Numeric Inputs (Zero-Leading Fix)**: Form fields default to `0`, and typing immediately replaces the `0` with the user's input (e.g. typing `5000` produces `5000`, never `05000`).
- **Multi-Shop Tenant Isolation (Max 4 Profiles)**: Every database record is partitioned by `shop_id`. Enterprise Admins can seamlessly switch between active shop profiles via a persistent switch bar.
- **Atomic Two-Way Ledger Synchronization**:
  - **Gate In**: Atomically increases stock quantities, logs stock movement audit trails, posts credit entries to the Vendor Ledger, and updates outstanding payables.
  - **Sales Billing**: Atomically deducts stock quantities, logs stock movement audit trails, posts invoice debit entries to the Customer Ledger, records advance payment credits, and updates outstanding receivables.
  - **Bill Void / Deletion**: Reverses ledger entries, restores stock levels, and records a cancellation audit log.
- **Comprehensive 5-Tab Detail Suites**: Dedicated management centers for Vendors and Customers (Overview, Ledger Statement, Transactions, Payments, and PDF/Print Reports).
- **A4 Commercial Print Engine**: Clean `@media print` CSS styling for high-contrast tax invoices, receiving receipts, payment slips, and chronologic ledger statements.
- **Full Database Backup & JSON Migration**: Export and restore complete system snapshots across all 16 database tables with integrity verification.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14.2 (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript 5.x (Strict mode) |
| **Styling & UI** | Tailwind CSS, Lucide Icons, shadcn/ui design patterns |
| **ORM** | Drizzle ORM |
| **Database** | Turso SQLite / LibSQL (`@libsql/client` with local file fallback) |
| **Charts** | Recharts (Financial analytics, revenue flows, aging) |
| **Auth & Security** | HMAC SHA-256 signed session cookies, bcrypt password hashing |
| **Target Cloud** | Vercel (Edge & Serverless Node.js runtime) |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18.17+ or v20+
- **npm** or **pnpm**

### 2. Installation
```bash
# Clone or navigate to the project directory
cd furniture-erp

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

For offline local development, the system automatically defaults to `file:local.db`:
```env
TURSO_DATABASE_URL=file:local.db
TURSO_AUTH_TOKEN=
SESSION_SECRET=furniture-erp-production-secret-encryption-key-secure-2026
```

### 4. Initialize & Seed the Database
Populate the database with the pre-configured multi-shop structure, users, sample catalog, Gate In receipts, sales bills, and ledger balances:
```bash
node scripts/seed.mjs
```

### 5. Run the 40-Point Automated Verification Suite
Confirm all multi-shop isolation rules, atomic ledger postings, and numeric inputs pass:
```bash
node scripts/verify-erp.mjs
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Default Login Credentials

The system seeds 4 realistic user accounts demonstrating multi-shop isolation and granular role permissions:

| Email | Password | Role | Assigned Shop | Granular Permissions |
|---|---|---|---|---|
| **`admin@royaloak.com`** | `Admin@123` | **Admin** | Shop 1 (Can switch to Shop 2) | Full Access (All 14 modules + User Management) |
| **`sales@royaloak.com`** | `Staff@123` | **Staff** | Shop 1 (Royal Oak) | Dashboard, Products, Inventory, Billing, Customers, Ledgers |
| **`purchase@royaloak.com`** | `Staff@123` | **Staff** | Shop 1 (Royal Oak) | Dashboard, Products, Inventory, Vendors, Gate In, Vendor Ledger |
| **`manager@heritagewood.com`** | `Staff@123` | **Staff** | Shop 2 (Heritage Woodcrafts) | Full branch access partitioned to Shop 2 |

> **Tip**: The login screen features **One-Click Demo Cards** for instant access without manual typing.

---

## ☁️ Turso Database Setup (Production)

Turso provides distributed SQLite database instances with ultra-low latency and zero cold-starts.

### Step 1: Create a Turso Database
Using the [Turso CLI](https://docs.turso.tech/cli/introduction):
```bash
# Install Turso CLI (if not already installed)
curl -sSfL https://get.tur.so/install.sh | bash

# Log in
turso auth login

# Create production database
turso db create furniture-erp-prod

# Retrieve the database URL
turso db show furniture-erp-prod --url
# Outputs: libsql://furniture-erp-prod-[user].turso.io

# Generate an auth token
turso db tokens create furniture-erp-prod
# Outputs: eyJhbGciOi...
```

*Alternatively, create your database in 1 click at [turso.tech](https://turso.tech).*

### Step 2: Seed the Remote Turso Database
Set your remote Turso URL and Auth Token in your local terminal and run the seed script:
```bash
TURSO_DATABASE_URL="libsql://furniture-erp-prod-[user].turso.io" \
TURSO_AUTH_TOKEN="your_auth_token_here" \
node scripts/seed.mjs
```

---

## 🚢 Vercel Deployment Guide

Deploying the Furniture ERP system to Vercel takes less than 2 minutes:

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "feat: complete furniture erp production build"
git remote add origin https://github.com/your-org/furniture-erp.git
git push -u origin main
```

### 2. Import into Vercel
1. Log in to [vercel.com](https://vercel.com) and click **Add New > Project**.
2. Select your `furniture-erp` repository.
3. Framework Preset: **Next.js** (automatically detected).
4. Root Directory: `./` (or directory path if monorepo).

### 3. Configure Environment Variables
In the Vercel project configuration, add the following 3 Environment Variables:

| Variable Name | Value | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://furniture-erp-prod-[user].turso.io` | Your permanent Turso database URL |
| `TURSO_AUTH_TOKEN` | `eyJhbGci...` | Your secret Turso access token |
| `SESSION_SECRET` | `a-strong-random-32-char-string` | Used for HMAC SHA-256 session token signatures |

### 4. Deploy
Click **Deploy**. Vercel will compile the Next.js App Router application and launch it globally.

---

## 📋 Comprehensive 40-Point Automated Verification Suite

To run the automated validation test suite at any time:
```bash
node scripts/verify-erp.mjs
```

The test suite systematically verifies 10 core enterprise operational criteria:
1. **Database Architecture & Integrity**: Confirms connection, all 16 tables, custom settings columns, multi-shop seeds, and strict absence of any Gate Out table.
2. **Multi-Shop Data Isolation**: Proves that catalog items, customers, bills, and vendor ledgers from Shop 1 are 100% invisible to Shop 2.
3. **User & Permission Management**: Validates admin and staff roles, JSON permissions, max 4 profile boundary, and bcrypt hashes.
4. **Purchasing & Gate In**: Validates atomic stock increment, stock movement log, automatic vendor ledger credit, and vendor payable balance.
5. **Vendor Payments & Ledger Debit**: Validates payment voucher recording, automatic ledger debit, balance reduction, and running balance continuity.
6. **Billing & Sales**: Validates invoice number sequencing, atomic stock deduction, stock movement log, customer ledger debit, and advance payment credit.
7. **Bill Reconciliation & Deletion**: Validates inventory restoration, audit log recording, and customer ledger/balance rollback.
8. **Customer Direct Payments**: Validates receipt recording, customer ledger credit, and receivable balance reduction.
9. **Zero-Leading Numeric Input UX**: Tests `handleNumericZeroReplace` to confirm `0` defaults are immediately replaced when typing digits (e.g. `5000` instead of `05000`).
10. **Backup & Scope Integrity**: Validates full 16-table database backup export and performs a strict source code scan ensuring zero Gate Out routes or components exist.

---

## 📁 System Architecture & Directory Structure

```
furniture-erp/
├── public/                     # Static brand assets and emblems
├── scripts/
│   ├── seed.mjs                # Multi-shop database seeding script
│   ├── verify-erp.mjs          # 40-Point automated verification suite
│   └── inspect-db.mjs          # Database schema inspector
├── src/
│   ├── app/
│   │   ├── (auth)/login/       # One-click demo login & authentication
│   │   ├── (dashboard)/
│   │   │   ├── billing/        # Invoices list, POS New Bill, and A4 print view
│   │   │   ├── customers/      # Customer directory, 5-tab detail, ledger, payments
│   │   │   ├── inventory/      # Stock levels, movements, and manual adjustments
│   │   │   ├── products/       # Furniture catalog and category management
│   │   │   ├── purchasing/     # Gate In receiving and receiving history
│   │   │   ├── reports/        # Financial analytics, sales, aging, CSV/print
│   │   │   ├── settings/       # Shop profile, prefixes, terms & live preview
│   │   │   ├── users/          # Admin user & permission management (max 4)
│   │   │   ├── backup/         # Full JSON database export & restore
│   │   │   ├── vendors/        # Vendor directory, 5-tab detail, ledger, payments
│   │   │   └── page.tsx        # Executive KPI dashboard & revenue charts
│   │   └── api/                # Secure server-side REST API route handlers
│   ├── components/
│   │   ├── layout/             # Responsive sidebar, header & shop switcher
│   │   └── ui/                 # Accessible UI components + NumericInput
│   └── lib/
│       ├── auth/               # HMAC session handling and permission matrix
│       ├── db/                 # Drizzle schema (16 tables) and Turso client
│       └── utils.ts            # Currency, date, and zero-leading number utils
├── drizzle.config.ts           # Drizzle ORM configuration
├── next.config.mjs             # Next.js build configuration
├── tailwind.config.ts          # Color tokens, fonts, and print styles
└── package.json
```

---

## 🔒 Security & Privacy

- **Server-Side Exclusivity**: `TURSO_AUTH_TOKEN` is never delivered to the client browser. All database writes, stock mutations, and ledger posts execute within Next.js server route handlers.
- **HMAC Signed Sessions**: User sessions are stored in HTTP-only, SameSite cookies with SHA-256 cryptographic signatures.
- **Audit Logging**: Every sensitive action (login, stock adjustments, invoice deletions, profile settings changes) is recorded in the permanent `audit_logs` table.

---

## 📄 License

This enterprise suite is developed for commercial deployment. All rights reserved.

Production Build Release: September 2026.
