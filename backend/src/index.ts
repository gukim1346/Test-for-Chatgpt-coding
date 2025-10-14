import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { Server } from 'socket.io';
import env from './config/env.js';
import authRoutes from './routes/auth.js';
import recordingsRoutes from './routes/recordings.js';
import notificationsRoutes from './routes/notifications.js';
import deviceRoutes from './routes/device.js';
import uploadRoutes from './routes/upload.js';
import { registerSocketHandlers } from './socket/device-socket.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.APP_ORIGIN,
    credentials: true,
  },
});
registerSocketHandlers(io);

app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/recordings', recordingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api', deviceRoutes);
app.use('/api/upload', uploadRoutes);

const port = env.PORT;
server.listen(port, () => {
  console.log(`API listening on :${port}`);
});
