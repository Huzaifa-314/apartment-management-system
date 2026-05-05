# Apartment Management System

A full-stack apartment management system with:

- **Frontend:** React + TypeScript + Vite (root workspace)
- **Backend:** Express + Node.js + Mongoose (`server/`)
- **Database:** MongoDB (local or Docker)

This guide is written for fresh machines so anyone can clone and run quickly.

## Tech Stack

- React 18, TypeScript, Vite, Tailwind CSS
- Express 4, Mongoose, JWT auth, Nodemailer
- MongoDB 7

---

## Project Structure

```text
apartment-management-system/
├── src/                  # Frontend source
├── server/
│   ├── src/              # Backend source
│   ├── .env.example      # Backend env template
│   └── package.json      # Backend scripts/deps
├── .env.example          # Frontend env template
├── package.json          # Frontend scripts/deps
└── README.md
```

---

## Prerequisites

Install these first:

- **Node.js 20 LTS** (recommended)
- **npm** (comes with Node)
- **Docker** (if using MongoDB in container), or local MongoDB service
- **Git**

Check versions:

```bash
node -v
npm -v
docker -v
git --version
```

---

## 1) Clone the Repository

```bash
git clone https://github.com/Huzaifa-314/apartment-management-system
cd apartment-management-system
```

---

## 2) Install Dependencies (Important: 2 installs)

This repo has two npm workspaces (root + `server`), so install both:

```bash
npm install
cd server && npm install && cd ..
```

---

## 3) Configure Environment Files

Create `.env` files from examples:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

### Root `.env` (frontend)

Default is fine for local dev:

```env
VITE_API_URL=
```

Why empty? In dev mode, Vite proxies `/api` and `/uploads` to `http://localhost:5000`.

### `server/.env` (backend)

Minimum recommended values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/room-management
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=optional-same-or-different-secret

# Optional email config (can stay empty in local dev)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Optional: seed script default password
SEED_PASSWORD=password
```

> Backend loads root `.env` first, then `server/.env` (server values override root values).

---

## 4) Start MongoDB

Choose one option below.

### Option A: MongoDB with Docker (recommended)

Run MongoDB container:

```bash
docker run -d --name room-mgmt-mongo -p 27017:27017 mongo:7
```

Check it:

```bash
docker ps
```

If already created before, start it:

```bash
docker start room-mgmt-mongo
```

### Option B: Local MongoDB Service

Start your local MongoDB service and keep:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/room-management
```

---

## 5) (Optional) Seed Demo Data

Populate sample users/rooms/payments:

```bash
npm run server:seed
```

Seed creates demo login accounts. Default password is from `SEED_PASSWORD` (default: `password`).

---

## 6) Run the App

### Run frontend + backend together

```bash
npm run dev:all
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Or run separately

Frontend only:

```bash
npm run dev
```

Backend only:

```bash
npm run server:dev
```

---

## 7) Verify It Works

Check backend health:

- Open: `http://localhost:5000/health`
- Expected response: `{"ok":true}`

If seeded, try login:

- Admin: `admin@example.com`
- Tenant: `tenant1@example.com`
- Password: value of `SEED_PASSWORD` (default `password`)

---

## Useful Scripts

From project root:

- `npm run dev` - start frontend (Vite)
- `npm run server:dev` - start backend in watch mode
- `npm run dev:all` - start both concurrently
- `npm run build` - build frontend
- `npm run lint` - run frontend lint
- `npm run server:seed` - seed database
- `npm run server:set-admin-password` - reset admin password helper
- `npm run server:clean-payment-statuses` - payment status maintenance helper

---

## Common Problems and Fixes

### 1) Frontend loads, but API calls fail

Possible reasons:

- Backend not running
- MongoDB not running
- Wrong `MONGODB_URI`
- Wrong `FRONTEND_URL`

Fix:

- Start backend with `npm run server:dev` (or `npm run dev:all`)
- Check MongoDB container/service status
- Confirm `server/.env` values

### 2) CORS errors in browser

Ensure:

```env
FRONTEND_URL=http://localhost:5173
```

If multiple origins are needed, use comma-separated values:

```env
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173
```

### 3) `MongooseServerSelectionError` or DB connection error

- MongoDB is not running
- Port conflict on `27017`
- Bad `MONGODB_URI`

Verify:

```bash
docker ps
```

And confirm URI in `server/.env`.

### 4) Node version issues

Use Node 20 LTS:

```bash
node -v
```

### 5) `npm install` worked but server still fails

You probably installed only root dependencies. Also run:

```bash
cd server && npm install
```

---

## Deployment Note

This README is focused on local development. For production:

- Use strong secrets for JWT variables
- Configure secure CORS origins
- Use managed MongoDB / secured Mongo deployment
- Set SMTP + payment credentials in environment

---

## License

Private/internal project unless your team defines a separate license policy.
