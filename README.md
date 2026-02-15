<![CDATA[# 🔒 Vault — Secure Cloud Storage

A full-stack Google Drive–like cloud storage platform with file uploads, nested folders, sharing, versioning, trash, search, and storage quotas.

**Live Demo**: [drive-frontend-xi.vercel.app](https://drive-frontend-xi.vercel.app)

---

## ✨ Features

- 📁 **File Management** — Upload, download, move, and delete files
- 📂 **Nested Folders** — Hierarchical folder structure with breadcrumb navigation
- 🔄 **File Versioning** — Automatic version tracking with restore capability
- 🗑️ **Trash & Restore** — Soft-delete with permanent delete and empty trash
- 🔗 **Sharing** — Share files/folders with users or via public links (with optional password & expiry)
- 🔍 **Search** — Full-text search across file names
- 📊 **Storage Quotas** — Per-user quota tracking and enforcement
- 🔐 **JWT Authentication** — Secure registration, login, and session management
- 🎨 **Modern UI** — Dark theme with glassmorphism, animations, and responsive design
- 🐳 **Docker Support** — One-command local setup with Docker Compose

---

## 🛠 Tech Stack

| Layer | Technology |
|:------|:-----------|
| Backend | Node.js · Express 5 · Sequelize ORM |
| Frontend | Next.js 14 · React · Lucide Icons |
| Database | PostgreSQL |
| Storage | S3-compatible (Supabase / AWS / MinIO) |
| Auth | JWT + bcryptjs |
| Deploy | Vercel (serverless) |

---

## 📁 Project Structure

```
Vault/
├── drive-backend/           # Express API
│   ├── api/index.js         # Vercel serverless entry
│   ├── src/
│   │   ├── app.js           # Express app config
│   │   ├── server.js        # Local dev server
│   │   ├── config/          # DB, env, storage
│   │   ├── middlewares/     # Auth, rate-limit, validation, quota
│   │   ├── migrations/     # Database migrations
│   │   ├── modules/         # auth, files, folders, trash, shares, search, users
│   │   ├── services/        # Storage adapters (S3 + local), quota
│   │   └── utils/           # Logger, JWT, ApiError
│   └── vercel.json
│
├── drive-frontend/          # Next.js app
│   ├── src/app/             # Pages: login, register, drive
│   ├── src/context/         # AuthContext, ToastContext
│   └── src/lib/api.js       # API client
│
├── docker-compose.yml       # Local dev environment
└── DOCUMENTATION.md         # Detailed technical docs
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** (local, Docker, or [Neon](https://neon.tech))
- **npm**

---

### Option A: Docker Compose (Recommended)

The fastest way to get everything running locally.

```bash
# 1. Clone the repo
git clone https://github.com/Dedsecwatch-ally/Vault.git
cd Vault

# 2. Create environment file
cp .env.docker.example .env.docker
```

Edit `.env.docker` with your values:

```env
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=drive_db
JWT_SECRET=your_jwt_secret_here
STORAGE_PROVIDER=local
```

```bash
# 3. Start all services
docker-compose --env-file .env.docker up --build

# Backend:  http://localhost:3000
# Frontend: http://localhost:3001
# Database: localhost:5432
```

---

### Option B: Manual Setup

#### 1. Clone and install

```bash
git clone https://github.com/Dedsecwatch-ally/Vault.git
cd Vault

# Install backend
cd drive-backend && npm install

# Install frontend
cd ../drive-frontend && npm install
```

#### 2. Configure backend

Create `drive-backend/.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (use your PostgreSQL or Neon URL)
DATABASE_URL=postgresql://user:password@localhost:5432/drive_db

# Auth
JWT_SECRET=your-secret-key-change-this

# Storage (use 'local' for development)
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads
```

#### 3. Run the backend

```bash
cd drive-backend
npm run dev
# ✅ Server running on http://localhost:3000
```

The database tables are auto-created on first run via Sequelize sync.

#### 4. Run the frontend

```bash
cd drive-frontend
npm run dev
# ✅ Frontend running on http://localhost:3001
```

The frontend proxies API calls to `localhost:3000` via Next.js rewrites — no CORS issues.

#### 5. Open the app

Go to [http://localhost:3001/register](http://localhost:3001/register), create an account, and start using Vault!

---

## ☁️ Deploy to Vercel

### Prerequisites

- [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
- A PostgreSQL database (e.g., [Neon](https://neon.tech) — free tier)
- S3-compatible storage (e.g., [Supabase Storage](https://supabase.com) — free tier)

### 1. Deploy the Backend

```bash
cd drive-backend

# Link to a Vercel project (first time only)
vercel link

# Set environment variables
vercel env add DATABASE_URL production      # Your Neon connection string
vercel env add JWT_SECRET production        # A strong random secret
vercel env add STORAGE_PROVIDER production  # "s3"
vercel env add AWS_REGION production        # e.g., "ap-south-1"
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add AWS_S3_BUCKET production     # e.g., "vault-storage"
vercel env add AWS_ENDPOINT production      # Supabase S3 endpoint URL

# Deploy
vercel --prod
```

Note your backend URL (e.g., `https://your-backend.vercel.app`).

### 2. Deploy the Frontend

```bash
cd drive-frontend

# Link to a separate Vercel project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production   # Your backend URL from step 1
vercel env add BACKEND_URL production           # Same backend URL

# Deploy
vercel --prod
```

### 3. Verify

```bash
# Test backend
curl https://your-backend.vercel.app/health
# → {"status":"ok","timestamp":"..."}

# Test frontend
curl -o /dev/null -w "%{http_code}" https://your-frontend.vercel.app
# → 200
```

---

## 🔧 Making Changes

### Adding a New API Endpoint

1. Create or edit files in `drive-backend/src/modules/<module>/`
2. Add the route in the module's `*.routes.js`
3. Register the route in `src/app.js` if it's a new module
4. Test locally with `npm run dev`

### Adding a New Frontend Page

1. Create a directory in `drive-frontend/src/app/<page-name>/`
2. Add `page.js` inside it (Next.js App Router convention)
3. Use `api` from `@/lib/api` for backend calls
4. Wrap authenticated pages with `useAuth()` from `@/context/AuthContext`

### Database Changes

```bash
# Create a new migration
cd drive-backend
npx sequelize-cli migration:generate --name add-new-column

# Run migrations
npm run migrate

# Undo last migration
npm run migrate:undo
```

### Redeploying After Changes

```bash
# Commit and push your changes
git add -A && git commit -m "your message" && git push

# Redeploy (Git auto-deploy is disabled — deploy manually)
cd drive-backend && vercel --prod
cd ../drive-frontend && vercel --prod
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|:-------|:---------|:----:|:------------|
| POST | `/api/auth/register` | ✗ | Register |
| POST | `/api/auth/login` | ✗ | Login |
| GET | `/api/auth/me` | ✓ | Get profile |
| GET | `/api/files` | ✓ | List files |
| POST | `/api/files/upload` | ✓ | Upload files |
| GET | `/api/files/:id/download` | ✓ | Download |
| DELETE | `/api/files/:id` | ✓ | Delete file |
| POST | `/api/files/:id/move` | ✓ | Move file |
| GET | `/api/folders` | ✓ | List folders |
| POST | `/api/folders` | ✓ | Create folder |
| GET | `/api/folders/:id/contents` | ✓ | Folder contents |
| GET | `/api/trash` | ✓ | List trash |
| POST | `/api/trash/:id/restore` | ✓ | Restore item |
| DELETE | `/api/trash/empty` | ✓ | Empty trash |
| POST | `/api/shares` | ✓ | Share with user |
| POST | `/api/shares/public` | ✓ | Public link |
| GET | `/api/search?q=term` | ✓ | Search files |
| GET | `/health` | ✗ | Health check |

> Full API reference available in [DOCUMENTATION.md](./DOCUMENTATION.md#11-api-reference)

---

## 📄 License

ISC

---

*Built with ☕ and deployed on Vercel.*
]]>
