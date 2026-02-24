# 🗂️ Drive Backend

A production-ready **Google Drive–like** file storage REST API built with Node.js, Express, and PostgreSQL. Features hierarchical folder storage, file versioning, sharing with granular permissions, trash/soft-delete, full-text search, storage quota management, and pluggable cloud storage (local, S3, or **Google Drive**).

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Auth** | JWT-based registration, login, and profile management |
| **File Management** | Upload, download, list, move, and delete files |
| **File Versioning** | Automatic version history on re-upload; restore any past version |
| **Folder Hierarchy** | Nested folders with materialized path resolution |
| **Trash / Soft Delete** | Soft-delete with restore; 30-day auto-purge |
| **File Sharing** | Share with specific users (view/edit/admin) or via public link with optional password & expiry |
| **Search** | Full-text search across files and folders with type/date/mime filters |
| **Quota Management** | Per-user 15 GB default quota with real-time tracking |
| **Cloud Storage** | Pluggable storage layer — local filesystem, AWS S3, or **Google Drive** |
| **Rate Limiting** | Per-endpoint rate limiting (auth, upload, general) |
| **Database Migrations** | Sequelize CLI migrations for reproducible schema changes |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js ≥ 18
- **Framework**: Express 5
- **ORM**: Sequelize 6 (with `sequelize-cli` for migrations)
- **Database**: PostgreSQL (Neon, RDS, or local)
- **Auth**: JSON Web Tokens (`jsonwebtoken` + `bcryptjs`)
- **File Upload**: Multer
- **Cloud Storage**: AWS SDK v3 (`@aws-sdk/client-s3`) · Google APIs (`googleapis`)
- **Logging**: Winston + Morgan
- **Testing**: Jest + Supertest

---

## 📁 Project Structure

```
drive-backend/
├── src/
│   ├── app.js                    # Express app setup & middleware
│   ├── server.js                 # Server entry point
│   ├── routes.js                 # (reserved)
│   ├── config/
│   │   ├── db.js                 # Sequelize connection (supports DATABASE_URL + SSL)
│   │   ├── database.js           # Sequelize CLI config
│   │   ├── env.js                # Environment variable loader & validation
│   │   └── storage.js            # Multer upload configuration
│   ├── constants/
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT authentication
│   │   ├── error.middleware.js    # Global error handler
│   │   ├── quota.middleware.js    # Pre-upload quota check
│   │   ├── rateLimit.middleware.js# Rate limiting (general/auth/upload)
│   │   └── validate.middleware.js # Request validation
│   ├── migrations/               # Sequelize migration files
│   ├── models/
│   │   └── index.js              # Model associations (User, File, Folder, Share)
│   ├── modules/
│   │   ├── auth/                 # Register, login, profile
│   │   ├── files/                # Upload, download, versioning, move, delete
│   │   ├── folders/              # CRUD, nested hierarchy, move
│   │   ├── search/               # Full-text search with filters
│   │   ├── shares/               # User sharing, public links
│   │   ├── trash/                # List, restore, permanent delete
│   │   └── users/                # User model with quota helpers
│   ├── services/
│   │   ├── quota.service.js      # Storage usage tracking
│   │   ├── storage.service.js    # Storage adapter factory
│   │   └── storage/
│   │       ├── local.adapter.js  # Local filesystem adapter
│   │       ├── s3.adapter.js     # AWS S3 adapter
│   │       └── gdrive.adapter.js # Google Drive adapter (OAuth2)
│   └── utils/
├── tests/
│   ├── setup.js                  # Test DB setup & teardown
│   ├── auth.test.js
│   ├── files.test.js
│   ├── folders.test.js
│   └── shares.test.js
├── uploads/                      # Local file storage directory
├── .env                          # Environment variables (not committed)
├── .env.example                  # Environment variable template
├── .sequelizerc                  # Sequelize CLI paths
├── jest.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** — local install or [Neon](https://neon.tech) (free cloud PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/drive-backend.git
cd drive-backend
npm install
```

### 2. Configure Environment

Copy the example and fill in your values:

```bash
cp .env.example .env
```

**Minimum required variables:**

```env
# Use a Neon connection string (recommended)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Or use individual vars for local PostgreSQL
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=drive_db
# DB_USER=postgres
# DB_PASSWORD=your_password

JWT_SECRET=your-secret-key-at-least-32-chars-long
```

### 3. Run Migrations (Production)

```bash
npm run migrate
```

### 4. Start the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`. Verify with:

```bash
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}
```

---

## 📡 API Reference

All endpoints (except auth and health) require a JWT token:

```
Authorization: Bearer <token>
```

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create a new account |
| POST | `/login` | Login & get JWT |
| GET | `/me` | Get current user profile |

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Pass1234!", "name": "User"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Pass1234!"}'
```

---

### 📄 Files — `/api/files`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload a file (multipart, field: `file`) |
| GET | `/` | List user's files (query: `folderId`, `page`, `limit`) |
| GET | `/:id` | Get file metadata |
| GET | `/:id/download` | Download file |
| GET | `/:id/versions` | Get version history |
| POST | `/:id/versions/:versionId/restore` | Restore a previous version |
| POST | `/:id/move` | Move file to folder (body: `folderId`) |
| DELETE | `/:id` | Soft-delete file (moves to trash) |

**Upload:**
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./document.pdf"
```

**Upload to folder:**
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./photo.jpg" \
  -F "folderId=<folder-uuid>"
```

**Allowed file types:** JPEG, PNG, GIF, WebP, PDF, DOC/DOCX, XLS/XLSX, TXT, CSV, ZIP, RAR

---

### 📂 Folders — `/api/folders`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create folder (body: `name`, optional `parentId`) |
| GET | `/` | List root folders |
| GET | `/:id` | Get folder details |
| GET | `/:id/contents` | List folder contents (files + subfolders) |
| PATCH | `/:id` | Rename folder (body: `name`) |
| POST | `/:id/move` | Move folder (body: `parentId`) |
| DELETE | `/:id` | Soft-delete folder |

**Create nested folder:**
```bash
curl -X POST http://localhost:3000/api/folders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Vacation Photos", "parentId": "<parent-folder-uuid>"}'
```

---

### 🗑️ Trash — `/api/trash`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List trashed items |
| POST | `/:id/restore` | Restore item from trash |
| DELETE | `/:id` | Permanently delete item |
| DELETE | `/empty` | Empty entire trash |

Items in trash are auto-purged after **30 days**.

---

### 🔗 Shares — `/api/shares`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Share with user (body: `resourceType`, `resourceId`, `sharedWithId`, `permission`) |
| POST | `/public` | Create public link (body: `resourceType`, `resourceId`, optional `password`, `expiresAt`) |
| GET | `/` | List shares you created |
| GET | `/shared-with-me` | List shared with you |
| GET | `/public/:token` | Access via public link |
| DELETE | `/:id` | Revoke share |

**Permission levels:** `view`, `edit`, `admin`

**Create a public link with password:**
```bash
curl -X POST http://localhost:3000/api/shares/public \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "file",
    "resourceId": "<file-uuid>",
    "password": "secret123",
    "expiresAt": "2026-03-01T00:00:00Z"
  }'
```

---

### 🔍 Search — `/api/search`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/?q=term` | Search files & folders (query: `q`, `type`, `mimeType`, `from`, `to`) |
| GET | `/recent` | Get recently accessed files |
| GET | `/quota` | Get storage usage info |

**Search with filters:**
```bash
curl "http://localhost:3000/api/search?q=report&type=file&mimeType=application/pdf" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | Yes* | — | PostgreSQL connection string (Neon/cloud) |
| `DB_HOST` | Yes* | `localhost` | Database host (if not using DATABASE_URL) |
| `DB_PORT` | No | `5432` | Database port |
| `DB_NAME` | Yes* | `drive_db` | Database name |
| `DB_USER` | Yes* | `postgres` | Database user |
| `DB_PASSWORD` | Yes* | — | Database password |
| `DB_SSL` | No | Auto | Enable SSL (auto-enabled if DATABASE_URL is set) |
| `JWT_SECRET` | **Yes** | — | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration time |
| `STORAGE_PROVIDER` | No | `local` | Storage backend: `local`, `s3`, or `gdrive` |
| `UPLOAD_DIR` | No | `./uploads` | Local upload directory |
| `MAX_FILE_SIZE` | No | `524288000` | Max file size in bytes (500 MB) |
| `AWS_REGION` | If S3 | — | AWS region |
| `AWS_ACCESS_KEY_ID` | If S3 | — | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | If S3 | — | AWS secret key |
| `AWS_S3_BUCKET` | If S3 | — | S3 bucket name |
| `GOOGLE_CLIENT_ID` | If gdrive | — | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | If gdrive | — | Google OAuth2 client secret |
| `GOOGLE_REFRESH_TOKEN` | If gdrive | — | OAuth2 refresh token (from auth script) |
| `GOOGLE_DRIVE_FOLDER_ID` | If gdrive | — | Target Google Drive folder ID |

*Either `DATABASE_URL` or the individual `DB_*` variables are required.

---

## 🔗 Google Drive Storage Setup

To use Google Drive as the storage backend:

### 1. Create Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or select an existing one)
3. Enable the **Google Drive API**: [APIs & Services → Library → Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)
4. Create OAuth2 credentials: **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:9876/oauth2callback`
5. Copy the **Client ID** and **Client Secret**

### 2. Add yourself as a Test User

If the app is in "Testing" mode:
- Go to **OAuth consent screen → Test users → Add users**
- Add your Google email

### 3. Get a Refresh Token

Run the one-time authorization script:

```bash
node scripts/gdrive-auth.js
```

This opens your browser for Google consent. After authorizing, it prints the `GOOGLE_REFRESH_TOKEN`.

### 4. Configure Environment Variables

```env
STORAGE_PROVIDER=gdrive
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_REFRESH_TOKEN=1//0g...
GOOGLE_DRIVE_FOLDER_ID=your-folder-id  # Optional — auto-creates if inaccessible
```

> **Note:** The adapter auto-creates a "Vault Files" folder in your Google Drive if the configured folder ID is inaccessible.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=auth.test.js

# Run with coverage
npm test -- --coverage
```

---

## 🗃️ Database Migrations

```bash
# Run all pending migrations
npm run migrate

# Undo last migration
npm run migrate:undo

# Check migration status
npx sequelize-cli db:migrate:status
```

**Note:** In development mode (`NODE_ENV=development`), Sequelize auto-syncs tables using `alter: true`. Use migrations for production deployments.

---

## 🌐 Deployment

### Recommended Stack

| Service | Purpose |
|---------|---------|
| [**Vercel**](https://vercel.com) | Backend + Frontend hosting |
| [**Neon**](https://neon.tech) | PostgreSQL database (free tier, 0.5 GB) |
| [**Google Drive**](https://drive.google.com) | File storage (15 GB free per account) |

### Deploy to Vercel

1. Push code to GitHub
2. Import both `drive-backend` and `drive-frontend` as Vercel projects
3. Add environment variables in Vercel project settings
4. Deploy

---

## 📊 Rate Limits

| Endpoint Group | Window | Max Requests |
|---------------|--------|-------------|
| General | 15 min | 100 |
| Auth (login/register) | 15 min | 20 |
| File Upload | 15 min | 30 |

---

## 📝 License

ISC
