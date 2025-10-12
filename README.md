# Smart Doorbell Platform

This repository contains the full-stack implementation of the smart doorbell system described in the original project brief. It ships a production-ready Node.js backend (Express + Socket.io + Prisma) and a React + Vite frontend that you can deploy to Google Cloud (Cloud Run + Firebase Hosting).

## Repository structure

```
.
├── backend/      # Express API, Socket.io gateway, Prisma schema, Cloud Run ready
├── frontend/     # React + Vite app with TailwindCSS, Firebase Hosting ready
└── README.md     # Project overview and deployment guide
```

## Backend (Cloud Run)

- **Tech stack**: Express, Socket.io, Prisma, PostgreSQL, Google Cloud Storage.
- **Authentication**: email/password login with bcrypt hashes and JWT stored in HTTP-only cookie.
- **Real-time**: Socket.io namespace exposes `ring`, `motion`, `uploadComplete`, and `status` events; clients can emit `unlock`, `led`, and `servo` commands.
- **Endpoints** (all prefixed with `/api` except `/healthz`):
  - `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
  - `GET /api/recordings`, `GET /api/recordings/:id`, `DELETE /api/recordings/:id`
  - `GET /api/notifications`, `POST /api/notifications/:id/read`
  - `GET /api/health`, `GET /api/snapshot`
  - Device webhooks: `POST /api/events/ring`, `POST /api/events/motion` (guarded by `X-Device-Key` header)
  - Upload ingest: `POST /api/upload` (multipart/form-data with clip file + metadata)

### Local development

```bash
cd backend
cp .env.example .env
# update DATABASE_URL, JWT_SECRET, GCS bucket, etc.
# install dependencies (requires internet access)
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The API defaults to port `8080`. Socket.io is served from the same origin (`/socket.io/`).

### Deploying to Cloud Run

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Use the provided Dockerfile template (see Deployment section below) or containerize via Cloud Build:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/doorbell-api
   gcloud run deploy doorbell-api \
     --image gcr.io/PROJECT_ID/doorbell-api \
     --platform managed \
     --allow-unauthenticated=false \
     --update-env-vars JWT_SECRET=...,APP_ORIGIN=https://app.yourdomain.com,...
   ```
3. Set required environment variables (JWT secret, database URL, device key, GCS bucket, signed URL TTL) via `--set-secrets` or Secret Manager.
4. Enable WebSockets for the Cloud Run service (default with HTTP/2).

## Frontend (Firebase Hosting)

- **Tech stack**: React 18 + TypeScript, Vite, TailwindCSS, Zustand for client-side stores.
- **Routing**: `/login`, `/dashboard`, `/recordings`, `/notifications`, `/settings` protected behind auth guard.
- **Accessibility**: keyboard reachable controls, visible focus states, toasts announced via `aria-live`.
- **Real-time**: connects to `wss://api.yourdomain.com/socket.io/` after successful login; reflects status changes and incoming events.

### Local development

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE` to your backend base URL (e.g. `http://localhost:8080`). The dev server runs on port `5173`.

### Deploying to Firebase Hosting

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Initialize Firebase Hosting in this directory (`firebase init hosting`).
3. Deploy with rewrites that proxy `/api` and `/socket.io/*` to the Cloud Run backend:
   ```json
   {
     "rewrites": [
       { "source": "/api/**", "run": { "serviceId": "doorbell-api", "region": "us-central1" } },
       { "source": "/socket.io/**", "run": { "serviceId": "doorbell-api", "region": "us-central1" } }
     ]
   }
   ```
4. Run `firebase deploy --only hosting`.

## Database & Prisma

The Prisma schema (see `backend/prisma/schema.prisma`) defines tables for users, recordings, notifications, and device state. Use `prisma migrate` to keep the Cloud SQL database in sync. Example migration workflow:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma migrate deploy # in CI/CD or Cloud Build
```

Seed at least one user manually (e.g. via `prisma.user.create`) and store the bcrypt hash in the database. You can create a simple seed script or use Prisma Studio (`npx prisma studio`).

## Google Cloud setup checklist

1. Create or select a GCP project; enable Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Cloud Storage, Cloud SQL, and Firebase Hosting.
2. Provision a Cloud SQL Postgres instance and database; note the connection string for `DATABASE_URL`.
3. Create a Google Cloud Storage bucket (regional) for recordings and optional thumbnails.
4. Store secrets (JWT secret, database URL, device API key) in Secret Manager and mount them into Cloud Run.
5. Configure the Raspberry Pi to send the `X-Device-Key` header and include the target `userId` when uploading clips or posting ring/motion webhooks.
6. Update DNS for `app.yourdomain.com` (Firebase Hosting) and `api.yourdomain.com` (Cloud Run custom domain) with HTTPS certificates.
7. Set up CI/CD (Cloud Build or GitHub Actions) to build the Docker image and deploy the frontend bundle automatically.

## Dockerfile templates

**Backend** (place in `backend/Dockerfile`):
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package*.json ./
CMD ["node", "dist/index.js"]
```

**Frontend** (place in `frontend/Dockerfile` if you prefer Cloud Run for hosting):
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

## Testing

- Backend: add unit tests for services and integration tests for routes (`npm run test`).
- Frontend: integrate Playwright or Cypress smoke tests (login, unlock action, ring event, recording playback).
- Accessibility: run Lighthouse audits targeting ≥95 accessibility score.

## Next steps

- Replace the placeholder snapshot handler with actual frame retrieval from Google Cloud Storage or directly from the device.
- Harden security (rate limiting, payload validation, device authentication).
- Add CI workflows for lint/test/build/deploy pipelines.

With the backend and frontend in place, you can now iterate on device firmware, extend analytics, and ship the MVP to Google Cloud.
