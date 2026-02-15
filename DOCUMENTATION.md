# Vault — Comprehensive Project Documentation

> A secure cloud storage platform built with Express 5 and Next.js, deployed on Vercel.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Backend Implementation](#3-backend-implementation)
4. [Frontend Implementation](#4-frontend-implementation)
5. [Database Design](#5-database-design)
6. [Local Development & Testing](#6-local-development--testing)
7. [Challenges During Local Testing](#7-challenges-during-local-testing)
8. [Deployment to Vercel](#8-deployment-to-vercel)
9. [Challenges During Deployment & Fixes](#9-challenges-during-deployment--fixes)
10. [Final Deployment Configuration](#10-final-deployment-configuration)
11. [API Reference](#11-api-reference)

---

## 1. Project Overview

**Vault** is a Google Drive–like cloud storage platform that allows users to upload, organize, share, and manage files. It features nested folder hierarchies, file versioning, trash/restore, sharing with permissions, full-text search, and storage quota management.

### Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Backend** | Node.js, Express 5, Sequelize ORM |
| **Frontend** | Next.js 14 (App Router), React, Lucide Icons |
| **Database** | PostgreSQL (Neon serverless) |
| **Storage** | Supabase S3–compatible storage |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Deployment** | Vercel (serverless functions) |
| **Containerization** | Docker Compose (local dev) |

### Monorepo Structure

```
Drive/
├── drive-backend/          # Express API server
│   ├── api/index.js        # Vercel serverless entry point
│   ├── src/
│   │   ├── app.js          # Express app setup
│   │   ├── server.js       # Local development server
│   │   ├── config/         # DB, env, storage config
│   │   ├── middlewares/    # Auth, error, rate limit, validation, quota
│   │   ├── migrations/    # Sequelize migrations (5 tables)
│   │   ├── models/         # Model associations
│   │   ├── modules/        # Feature modules (7)
│   │   ├── services/       # Storage & quota services
│   │   └── utils/          # Logger, JWT, ApiError
│   ├── vercel.json
│   └── package.json
│
├── drive-frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/            # Pages (login, register, drive)
│   │   ├── context/        # AuthContext, ToastContext
│   │   └── lib/            # API client
│   ├── next.config.mjs
│   └── package.json
│
├── docker-compose.yml      # Local dev with PostgreSQL
├── .env.docker             # Docker environment variables
└── .gitignore
```

---

## 2. Architecture

### Backend Architecture

The backend follows a **modular architecture** where each feature is self-contained in its own module directory with its own routes, controller, service, and model.

```
Request Flow:
┌─────────┐    ┌──────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐
│  Client  │───▸│ Middleware│───▸│  Controller │───▸│   Service   │───▸│  Model   │
└─────────┘    └──────────┘    └────────────┘    └────────────┘    └──────────┘
                 │ CORS          │ Parse req       │ Business      │ Sequelize
                 │ Helmet        │ Validate        │ Logic         │ PostgreSQL
                 │ Rate Limit    │ Send res        │ Storage ops   │
                 │ Auth (JWT)    │                 │               │
                 │ Body Parser   │                 │               │
```

### Frontend Architecture

The frontend uses **Next.js App Router** with client-side rendering for the drive interface and server-side routing for auth pages.

```
Frontend Flow:
┌───────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  Page      │───▸│ AuthContext   │───▸│  API Client   │───▸│ Backend  │
│ Component  │    │ (user state) │    │ (fetch calls) │    │  API     │
└───────────┘    └──────────────┘    └──────────────┘    └──────────┘
                  │ login()           │ baseUrl config
                  │ register()        │ token mgmt
                  │ logout()          │ error handling
                  │ refreshUser()     │
```

---

## 3. Backend Implementation

### 3.1 Configuration (`src/config/`)

#### `env.js` — Environment Variable Loader
- Loads `.env` via dotenv in development
- Skips file loading on Vercel (`!process.env.VERCEL`)
- Validates required vars: `JWT_SECRET`
- Validates S3 vars when `STORAGE_PROVIDER=s3`

#### `db.js` — Database Connection
- Uses Sequelize with PostgreSQL
- Supports `DATABASE_URL` (connection string) or individual `DB_*` vars
- Adds `dialectModule: require('pg')` for Vercel compatibility
- Enables SSL when `DATABASE_URL` is present
- Syncs models on connection (alter in dev, safe sync in prod)
- Uses `throw error` instead of `process.exit(1)` for serverless compatibility

#### `storage.js` — Multer Upload Configuration
- Uses `multer.diskStorage` with two destination strategies:
  - **Production/S3**: Uploads to `os.tmpdir()` (temp directory)
  - **Development/Local**: Uploads to `UPLOAD_DIR` (`./uploads`)
- Generates unique filenames using UUID v4
- File filter restricts uploads to: images, PDFs, documents, spreadsheets, archives, video, audio
- Max file size configurable via `MAX_FILE_SIZE` (default 50MB)

### 3.2 Middlewares (`src/middlewares/`)

| Middleware | File | Purpose |
|:-----------|:-----|:--------|
| **Authentication** | `auth.middleware.js` | Verifies JWT token from `Authorization: Bearer <token>` header. Attaches `req.user` with decoded payload. |
| **Error Handler** | `error.middleware.js` | Global error handler that formats `ApiError` instances into standardized JSON responses. Includes 404 catch-all. |
| **Rate Limiting** | `rateLimit.middleware.js` | General limiter (100 req/15min) + strict auth limiter (20 req/15min) for login/register routes. |
| **Validation** | `validate.middleware.js` | Uses `express-validator` with pre-defined rules for email, password, and name fields. Returns 400 on validation failure. |
| **Quota Check** | `quota.middleware.js` | Checks user's storage usage before allowing file uploads. Rejects with 403 if quota exceeded. |

### 3.3 Feature Modules (`src/modules/`)

#### Auth Module (`auth/`)
| File | Description |
|:-----|:------------|
| `auth.routes.js` | `POST /register`, `POST /login`, `GET /me` |
| `auth.controller.js` | Handles request/response, delegates to service |
| `auth.service.js` | Creates users, verifies passwords, generates JWT tokens |
| `auth.schema.js` | Validation schemas (if used by express-validator) |

**Registration Flow:**
1. Validate input (name, email, password)
2. Check for existing user by email → 409 Conflict if exists
3. Create user (password auto-hashed via Sequelize `beforeCreate` hook)
4. Generate JWT token with `{ id, email }` payload
5. Return `{ user: safeObject, token }`

**Login Flow:**
1. Find user by email → 401 if not found
2. Compare password with bcrypt → 401 if mismatch
3. Generate JWT token
4. Return `{ user: safeObject, token }`

#### Files Module (`files/`)
| File | Description |
|:-----|:------------|
| `files.routes.js` | CRUD operations + upload, download, move, versioning |
| `files.controller.js` | Request handling with multer for file uploads |
| `files.service.js` | File CRUD logic, S3 integration, version management |
| `file.model.js` | Sequelize model with soft-delete (`paranoid: true`) |

**Key Endpoints:**
- `POST /api/files/upload` — Upload files (multipart/form-data)
- `GET /api/files` — List files (paginated, optional folderId filter)
- `GET /api/files/:id/download` — Download a file
- `DELETE /api/files/:id` — Soft-delete (move to trash)
- `POST /api/files/:id/move` — Move file to different folder
- `GET /api/files/:id/versions` — List all versions
- `POST /api/files/:id/versions/:versionId/restore` — Restore a version

#### Folders Module (`folders/`)
- Nested folder hierarchies (self-referencing `parentId`)
- `GET /api/folders` — List folders (optional `parentId`)
- `POST /api/folders` — Create folder
- `GET /api/folders/:id/contents` — Get folder contents (files + subfolders)
- `PATCH /api/folders/:id` — Rename folder
- `DELETE /api/folders/:id` — Delete folder
- `POST /api/folders/:id/move` — Move folder

#### Trash Module (`trash/`)
- Lists soft-deleted files and folders
- `GET /api/trash` — List trashed items
- `POST /api/trash/:id/restore` — Restore from trash
- `DELETE /api/trash/:id` — Permanent delete
- `DELETE /api/trash/empty` — Empty entire trash

#### Shares Module (`shares/`)
- Share files/folders with other users by email
- Permission levels: `view`, `edit`
- Public link sharing with optional password and expiry
- `POST /api/shares` — Share with user
- `POST /api/shares/public` — Create public link
- `GET /api/shares` — List shares I created
- `GET /api/shares/shared-with-me` — List shares received
- `DELETE /api/shares/:id` — Revoke a share

#### Search Module (`search/`)
- Full-text search across file names
- `GET /api/search?q=<query>` — Search files
- `GET /api/search/recent` — Recently modified files
- `GET /api/search/quota` — Current storage usage

#### Users Module (`users/`)
- User model definition with Sequelize
- Password hashing via bcrypt (12 rounds)
- Storage quota tracking (1GB default)
- Instance methods: `comparePassword()`, `toSafeObject()`, `hasAvailableStorage()`, `getStorageUsagePercent()`

### 3.4 Services (`src/services/`)

#### Storage Service (`storage.service.js`)
- Factory pattern that selects adapter based on `STORAGE_PROVIDER`
- **S3 Adapter** (`storage/s3.adapter.js`): Uses `@aws-sdk/client-s3` and `@aws-sdk/lib-storage` for upload/download/delete. Configured for Supabase S3-compatible storage.
- **Local Adapter** (`storage/local.adapter.js`): Reads/writes to local filesystem. Used in development.

#### Quota Service (`quota.service.js`)
- Checks available storage before uploads
- Updates user's `storageUsed` after upload/delete
- Calculates storage usage percentage

### 3.5 Utilities (`src/utils/`)

| Utility | Purpose |
|:--------|:--------|
| `ApiError.js` | Custom error class with HTTP status codes (400, 401, 403, 404, 409, 500) |
| `jwt.js` | Token generation and verification using `jsonwebtoken` |
| `logger.js` | Winston logger — console-only (file transport disabled on Vercel) |

---

## 4. Frontend Implementation

### 4.1 Pages

| Page | Route | Description |
|:-----|:------|:------------|
| **Home** | `/` | Landing page with redirect to login |
| **Login** | `/login` | Email/password sign-in with form validation |
| **Register** | `/register` | Account creation with name, email, password |
| **Drive** | `/drive` | Main file manager interface |

### 4.2 Drive Page Features

The `/drive` page is the core of the application (545 lines) with these features:

- **File Upload**: Click button or drag-and-drop files
- **Folder Navigation**: Breadcrumb-based navigation with nested folders
- **Create Folder**: Modal to create new folders
- **Download Files**: Direct download via blob response
- **Delete Files/Folders**: Soft-delete to trash
- **Trash View**: Toggle between files and trash
- **Restore/Permanent Delete**: Manage trashed items
- **Search**: Real-time search across file names
- **Share**: Share files with other users via email
- **Storage Quota**: Visual indicator of used storage
- **View Modes**: Grid and list views
- **Responsive Design**: Mobile-friendly with sidebar toggle

### 4.3 Context Providers

#### AuthContext (`context/AuthContext.js`)
- Manages user authentication state globally
- Auto-loads user profile on mount (if token exists in localStorage)
- Provides: `user`, `loading`, `login()`, `register()`, `logout()`, `refreshUser()`

#### ToastContext (`context/ToastContext.js`)
- Global notification/toast system
- Provides: `success()`, `error()`, `info()`, `warning()` methods

### 4.4 API Client (`lib/api.js`)

Centralized HTTP client class with:
- **Base URL**: Uses `NEXT_PUBLIC_API_URL` env var (direct backend calls in production) or empty string (localhost via Next.js rewrites in development)
- **Token Management**: `getToken()`, `setToken()`, `removeToken()` using localStorage
- **Auto-Auth**: Automatically attaches `Authorization: Bearer <token>` header
- **Content-Type**: Auto-sets `application/json` unless sending FormData
- **Error Handling**: Parses JSON error responses and throws with status codes

---

## 5. Database Design

### Entity-Relationship Diagram

```
┌──────────┐       ┌──────────┐       ┌──────────────┐
│  Users   │───┐   │ Folders  │       │ File Versions│
│          │   │   │          │       │              │
│ id (PK)  │   │   │ id (PK)  │       │ id (PK)      │
│ email    │   │   │ name     │       │ file_id (FK) │
│ password │   │   │ owner_id │◄──┐   │ version_num  │
│ name     │   │   │ parent_id│───┘   │ filename     │
│ storage_ │   │   └──────────┘       │ size         │
│  used    │   │        ▲             └──────────────┘
│ storage_ │   │        │
│  quota   │   │   ┌──────────┐       ┌──────────┐
└──────────┘   │   │  Files   │       │  Shares  │
               │   │          │       │          │
               └──▸│ id (PK)  │       │ id (PK)  │
                   │ original │       │ resource │
                   │  _name   │       │  _type   │
                   │ filename │       │ resource │
                   │ mime_type│       │  _id     │
                   │ size     │       │ shared_  │
                   │ path     │       │  by_id   │
                   │ folder_id│───────│ shared_  │
                   │ owner_id │       │  with_id │
                   │ current_ │       │ permission│
                   │  version │       │ is_public│
                   │ deleted_ │       │ password │
                   │  at      │       │ expires_ │
                   └──────────┘       │  at      │
                                      └──────────┘
```

### Migrations (5 files)

| # | Migration | Table | Key Columns |
|:--|:----------|:------|:------------|
| 1 | `create-users` | `users` | id, email, password, name, storage_used, storage_quota |
| 2 | `create-folders` | `folders` | id, name, owner_id, parent_id (self-ref) |
| 3 | `create-files` | `files` | id, original_name, filename, mime_type, size, path, folder_id, owner_id, deleted_at |
| 4 | `create-file-versions` | `file_versions` | id, file_id, version_number, filename, size, path |
| 5 | `create-shares` | `shares` | id, resource_type, resource_id, shared_by_id, shared_with_id, permission, is_public |

### Model Associations

```javascript
User.hasMany(File)        // A user owns many files
User.hasMany(Folder)      // A user owns many folders
User.hasMany(Share)       // A user creates/receives many shares
File.belongsTo(User)      // A file belongs to an owner
File.belongsTo(Folder)    // A file belongs to a folder
Folder.belongsTo(User)    // A folder belongs to an owner
Folder.hasMany(File)      // A folder contains many files
Share.belongsTo(User)     // A share has a creator and recipient
```

---

## 6. Local Development & Testing

### Prerequisites

- Node.js ≥ 18.0.0
- PostgreSQL (via Docker or Neon)
- npm

### Running Locally

**Option A: Direct (with Neon DB)**
```bash
# Backend
cd drive-backend
cp .env.example .env    # Configure DATABASE_URL, JWT_SECRET, etc.
npm install
npm run dev             # Starts on http://localhost:3000

# Frontend (separate terminal)
cd drive-frontend
npm install
npm run dev             # Starts on http://localhost:3001
```

**Option B: Docker Compose**
```bash
cp .env.docker.example .env.docker
docker-compose --env-file .env.docker up
# Backend: http://localhost:3000
# Frontend: http://localhost:3001
# PostgreSQL: localhost:5432
```

### Docker Compose Services

| Service | Image/Build | Port | Description |
|:--------|:------------|:-----|:------------|
| `db` | `postgres:15-alpine` | 5432 | PostgreSQL database |
| `backend` | `./drive-backend` | 3000 | Express API server |
| `frontend` | `./drive-frontend` | 3001 | Next.js frontend |

---

## 7. Challenges During Local Testing

### Challenge 1: Database Connection with Docker
**Problem**: The backend couldn't connect to PostgreSQL when running via Docker Compose because it used `localhost` as the DB host.  
**Fix**: Docker Compose uses internal networking. Set `DB_HOST=db` (the service name) in the `docker-compose.yml` environment, overriding the `.env` file's `localhost`.

### Challenge 2: Frontend API Calls Failing Locally
**Problem**: The frontend running on port 3001 couldn't reach the backend on port 3000 due to CORS and different origins.  
**Fix**: Added Next.js rewrites in `next.config.mjs` to proxy `/api/*` requests to `http://localhost:3000/api/*`, avoiding CORS entirely during local development:
```javascript
async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:3000/api/:path*' }];
}
```

### Challenge 3: "User Does Not Exist" on Login
**Problem**: After database resets (restarting Docker, switching DB), login returned "Invalid email or password" because no users existed.  
**Fix**: Users needed to register first at `/register`. The database uses `sequelize.sync({ alter: true })` in development which creates tables automatically but doesn't seed data.

### Challenge 4: Multer Upload Directory
**Problem**: File uploads failed because the `./uploads` directory didn't exist by default.  
**Fix**: The `LocalStorageAdapter` ensures the upload directory exists on initialization using `fs.mkdirSync(dir, { recursive: true })`.

---

## 8. Deployment to Vercel

### Deployment Strategy

The project uses a **monorepo** structure with two separate Vercel projects:

| Vercel Project | Directory | Type | URL |
|:---------------|:----------|:-----|:----|
| `drive-backend` | `drive-backend/` | Node.js Serverless | `drive-backend-flax.vercel.app` |
| `drive-frontend` | `drive-frontend/` | Next.js | `drive-frontend-xi.vercel.app` |

### Vercel Entry Point (`api/index.js`)

The backend uses a Vercel serverless function entry point that wraps the Express app:

```javascript
let app;
try {
    app = require('../src/app');
    const { connectDB } = require('../src/config/db');
    connectDB().catch((err) => console.error('DB connection failed:', err.message));
} catch (err) {
    console.error('FATAL: App failed to initialize:', err);
    app = (req, res) => {
        res.status(500).json({
            error: 'App initialization failed',
            message: err.message,
            stack: err.stack,
        });
    };
}
module.exports = app;
```

### Routing Configuration (`vercel.json`)

```json
{
    "version": 2,
    "builds": [{ "src": "api/index.js", "use": "@vercel/node" }],
    "routes": [
        { "src": "/api/(.*)", "dest": "api/index.js", "headers": { "Access-Control-Allow-Origin": "*" } },
        { "src": "/health", "dest": "api/index.js" },
        { "src": "/(.*)", "dest": "api/index.js" }
    ]
}
```

### Environment Variables

**Backend (8 variables):**
| Variable | Description |
|:---------|:------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT token signing |
| `STORAGE_PROVIDER` | `s3` (production) or `local` (development) |
| `AWS_REGION` | Supabase S3 region (`ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | Supabase storage access key |
| `AWS_SECRET_ACCESS_KEY` | Supabase storage secret key |
| `AWS_S3_BUCKET` | Storage bucket name (`vault-storage`) |
| `AWS_ENDPOINT` | Supabase S3-compatible endpoint URL |

**Frontend (2 variables):**
| Variable | Description |
|:---------|:------------|
| `BACKEND_URL` | Backend URL for Next.js rewrites (server-side) |
| `NEXT_PUBLIC_API_URL` | Backend URL for direct client-side API calls |

### Deploy Commands

```bash
# Backend
cd drive-backend && vercel --prod

# Frontend
cd drive-frontend && vercel --prod
```

---

## 9. Challenges During Deployment & Fixes

### Issue 1: `FUNCTION_INVOCATION_FAILED` — Logger Writing to Read-Only Filesystem
**Symptom**: Backend returned 500 error with `FUNCTION_INVOCATION_FAILED` on every request.  
**Root Cause**: Winston logger had a `File` transport that attempted to write to `logs/error.log` and `logs/combined.log` in production. Vercel's filesystem is **read-only**.  
**Fix**: Disabled file transport when running on Vercel. Console transport is sufficient because Vercel captures `stdout`/`stderr` automatically.
```javascript
// src/utils/logger.js
if (env.NODE_ENV === 'production' && !process.env.VERCEL) {
    // Only add file transport if NOT on Vercel
}
```

### Issue 2: `FUNCTION_INVOCATION_FAILED` — Multer Writing to `./uploads`
**Symptom**: File uploads crashed because `multer.diskStorage` tried to write to `./uploads` which doesn't exist on Vercel's read-only FS.  
**Fix**: Changed multer destination to use `os.tmpdir()` in production/S3 mode:
```javascript
destination: (req, file, cb) => {
    if (env.STORAGE_PROVIDER === 's3' || env.NODE_ENV === 'production') {
        cb(null, os.tmpdir());  // Vercel's writable temp dir
    } else {
        cb(null, env.UPLOAD_DIR);
    }
}
```

### Issue 3: `FUNCTION_INVOCATION_FAILED` — `process.exit(1)` in Serverless
**Symptom**: If the database connection failed on cold start, the entire serverless function was killed permanently.  
**Root Cause**: `db.js` called `process.exit(1)` on connection failure, which is appropriate for long-running servers but fatal for serverless functions (they can't retry).  
**Fix**: Replaced with `throw error`:
```javascript
} catch (error) {
    logger.error('❌ Unable to connect to PostgreSQL:', error);
    throw error; // Don't process.exit in serverless environments
}
```

### Issue 4: `ERR_REQUIRE_ESM` — UUID v13 is ESM-Only
**Symptom**: `FUNCTION_INVOCATION_FAILED` with error: `require() of ES Module uuid/dist-node/index.js not supported`.  
**Root Cause**: `uuid@13` dropped CommonJS support and became ESM-only. The backend uses CommonJS (`require()`), so `require('uuid')` fails at runtime.  
**Discovery**: Added a diagnostic try/catch wrapper in `api/index.js` that returned the actual error as JSON instead of a generic 500 — this revealed the `ERR_REQUIRE_ESM` error.  
**Fix**: Downgraded `uuid` to v9 which supports both CommonJS and ESM:
```bash
npm install uuid@9
```

### Issue 5: `dotenv` Loading Missing `.env` File
**Symptom**: Vercel logged warnings about injecting 0 environment variables because `dotenv` tried to load `../../.env` which doesn't exist on Vercel.  
**Fix**: Skip `dotenv.config()` when running on Vercel (env vars are injected by the platform):
```javascript
if (!process.env.VERCEL) {
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}
```

### Issue 6: Vercel 404 on `/api/*` Routes
**Symptom**: Direct API calls to `https://drive-backend-flax.vercel.app/api/auth/login` returned Vercel's `NOT_FOUND` HTML page instead of reaching Express.  
**Root Cause**: The original `vercel.json` only had a catch-all route `/(.*) → api/index.js`. Vercel's edge layer intercepted `/api/*` paths before the catch-all route could match, looking for serverless functions in the `api/` directory.  
**Fix**: Added explicit `/api/*` route **before** the catch-all:
```json
"routes": [
    { "src": "/api/(.*)", "dest": "api/index.js" },  // Explicit — handles API
    { "src": "/health", "dest": "api/index.js" },     // Health check
    { "src": "/(.*)", "dest": "api/index.js" }         // Catch-all
]
```

### Issue 7: Next.js Rewrites Intercepted by Vercel
**Symptom**: Frontend API calls (via Next.js rewrites) returned `NOT_FOUND` even though direct backend calls worked.  
**Root Cause**: On Vercel, Next.js `/api/*` paths are intercepted by Vercel's edge layer looking for serverless API route functions in `pages/api/` or `app/api/`. The Next.js rewrite never fired.  
**Fix**: Changed the frontend API client to call the backend directly instead of relying on rewrites:
```javascript
// src/lib/api.js
this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
// NEXT_PUBLIC_API_URL = "https://drive-backend-flax.vercel.app" in production
// Empty string in development (uses Next.js rewrites locally)
```

### Issue 8: Git Auto-Deploy Overwriting CLI Deployments
**Symptom**: After pushing to GitHub, the working backend deployment was replaced by a broken build that returned `NOT_FOUND`.  
**Root Cause**: Both Vercel projects were linked to the GitHub repo. Git pushes triggered auto-deployments from the **repo root** (not the subdirectory), producing builds without the Express app code (since `vercel.json` and `api/index.js` are in `drive-backend/`, not the root).  
**Fix**: Disconnected Git integration for both projects via the Vercel API:
```bash
curl -X DELETE "https://api.vercel.com/v9/projects/<projectId>/link"
```

### Issue 9: Duplicate Vercel Projects
**Symptom**: Multiple stale projects (`drive-back`, `backend`, `vault-back`, `vault`) existed from earlier manual setup attempts, causing confusion.  
**Fix**: Removed all 4 duplicate projects via CLI:
```bash
echo "y" | vercel project rm drive-back
echo "y" | vercel project rm backend
echo "y" | vercel project rm vault-back
echo "y" | vercel project rm vault
```

---

## 10. Final Deployment Configuration

### Live URLs

| Service | URL |
|:--------|:----|
| **Backend API** | https://drive-backend-flax.vercel.app |
| **Frontend App** | https://drive-frontend-xi.vercel.app |
| **Health Check** | https://drive-backend-flax.vercel.app/health |

### External Services

| Service | Provider | Purpose |
|:--------|:---------|:--------|
| **Database** | Neon | Serverless PostgreSQL |
| **File Storage** | Supabase Storage | S3-compatible object storage |
| **Hosting** | Vercel | Serverless deployment (free tier) |

### How to Redeploy

Since Git auto-deploy is disconnected, deploy manually via CLI:

```bash
# Deploy backend
cd drive-backend && vercel --prod

# Deploy frontend
cd drive-frontend && vercel --prod
```

### Git History

| Commit | Description |
|:-------|:------------|
| `c518606` | Initial commit — full backend + frontend |
| `b102d4a` | fix: disable file logging for vercel readonly fs |
| `318b428` | fix: use tmpdir for uploads on vercel |
| `ea491f7` | fix: vercel deployment — fix multer import, remove process.exit, skip dotenv on vercel |
| `a0021c1` | fix: downgrade uuid to v9 for CommonJS compatibility on vercel |
| `8cf0d40` | fix: explicit api route in vercel.json to prevent vercel 404 on /api paths |
| `c33551d` | fix: use NEXT_PUBLIC_API_URL for direct backend calls on vercel |

---

## 11. API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| POST | `/api/auth/register` | ✗ | Register new user |
| POST | `/api/auth/login` | ✗ | Login and get JWT token |
| GET | `/api/auth/me` | ✓ | Get current user profile |

### Files

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| GET | `/api/files` | ✓ | List files (paginated) |
| POST | `/api/files/upload` | ✓ | Upload files (multipart) |
| GET | `/api/files/:id/download` | ✓ | Download a file |
| DELETE | `/api/files/:id` | ✓ | Soft-delete file |
| POST | `/api/files/:id/move` | ✓ | Move file to folder |
| GET | `/api/files/:id/versions` | ✓ | List file versions |
| POST | `/api/files/:id/versions/:vid/restore` | ✓ | Restore version |

### Folders

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| GET | `/api/folders` | ✓ | List folders |
| POST | `/api/folders` | ✓ | Create folder |
| GET | `/api/folders/:id/contents` | ✓ | Get folder contents |
| PATCH | `/api/folders/:id` | ✓ | Rename folder |
| DELETE | `/api/folders/:id` | ✓ | Delete folder |
| POST | `/api/folders/:id/move` | ✓ | Move folder |

### Trash

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| GET | `/api/trash` | ✓ | List trashed items |
| POST | `/api/trash/:id/restore` | ✓ | Restore from trash |
| DELETE | `/api/trash/:id` | ✓ | Permanently delete |
| DELETE | `/api/trash/empty` | ✓ | Empty all trash |

### Shares

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| POST | `/api/shares` | ✓ | Share with user |
| POST | `/api/shares/public` | ✓ | Create public link |
| GET | `/api/shares` | ✓ | List my shares |
| GET | `/api/shares/shared-with-me` | ✓ | List shared with me |
| DELETE | `/api/shares/:id` | ✓ | Revoke share |

### Search

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| GET | `/api/search?q=<query>` | ✓ | Search files |
| GET | `/api/search/recent` | ✓ | Recent files |
| GET | `/api/search/quota` | ✓ | Storage usage |

### Health

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| GET | `/health` | ✗ | Health check |

---

*Generated on: February 15, 2026*
