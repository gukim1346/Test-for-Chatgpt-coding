# Smart Doorbell Web App

React + Vite frontend for the smart doorbell platform. The app consumes the Express/Socket.io backend and is optimized for Firebase Hosting.

## Requirements

- Node.js 20+
- Backend API running locally (`VITE_API_BASE=http://localhost:8080`) or deployed (e.g. `https://api.yourdomain.com`).

## Development

```bash
cp .env.example .env
npm install
npm run dev
```

Visit `http://localhost:5173`. The dev server proxies requests directly to the API defined in `VITE_API_BASE`.

## Build

```bash
npm run build
```

The production bundle is output to `dist/`. Deploy it to Firebase Hosting (recommended) or any static host. When using Firebase Hosting, configure rewrites so that `/api/**` and `/socket.io/**` forward to the Cloud Run backend.

## Testing

Add component/unit tests with Vitest or React Testing Library and smoke E2E tests with Playwright/Cypress. Target Lighthouse scores: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95.
