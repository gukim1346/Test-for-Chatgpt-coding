# Smart Doorbell API

This service exposes the REST + WebSocket backend for the smart doorbell platform. It is designed to run locally with SQLite/Postgres during development and to deploy on Google Cloud Run with Cloud SQL and Google Cloud Storage.

## Requirements

- Node.js 20+
- PostgreSQL database (for local development you can use Docker or change `DATABASE_URL` to point to a local instance)
- (Optional) Google Cloud Storage bucket for clip storage. When not configured, files are stored on the local filesystem under `uploads/`.

## Getting started

```bash
cp .env.example .env
npm install
npx prisma generate
# adjust DATABASE_URL in .env, then apply migrations
npx prisma migrate dev --name init
npm run dev
```

The dev server listens on `http://localhost:8080`. Socket.io is served from the same origin (`/socket.io/`).

### Seeding a user

Use Prisma Studio or a short script to insert a user:

```bash
npx prisma studio
```

Set the `password` field to a bcrypt hash (`bcrypt.hashSync('your-password', 10)`).

## Production build

```bash
npm run build
```

Deploy the resulting bundle to Cloud Run using the Dockerfile snippet from the root README. Remember to set environment variables and secret references for:

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_ORIGIN`
- `DEVICE_API_KEY`
- `GCS_BUCKET`, `GCP_PROJECT_ID`, `GCS_SIGNED_URL_TTL_SECONDS`

## Tests

Add integration/unit tests under `src/` and run them via `npm test` (script placeholder). Consider using `vitest` or `jest` with `supertest` for API validation.
