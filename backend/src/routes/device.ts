import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { emitToClients } from '../socket/device-socket.js';

const router = Router();
const PLACEHOLDER_SNAPSHOT = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64'
);

router.get('/snapshot', authenticate, async (_req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.send(PLACEHOLDER_SNAPSHOT);
});

router.get('/health', authenticate, async (_req: AuthenticatedRequest, res) => {
  const state = await prisma.deviceState.findUnique({ where: { id: env.DEVICE_ID ?? 'doorbell' } });
  res.json({ status: state ? 'ok' : 'unknown', lastRingAt: state?.lastRingAt, storagePercent: null });
});

router.post('/events/ring', async (req, res) => {
  if (req.headers['x-device-key'] !== env.DEVICE_API_KEY) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const userId = (req.body.userId as string) ?? '';
  await prisma.deviceState.upsert({
    where: { id: env.DEVICE_ID ?? 'doorbell' },
    update: { lastRingAt: new Date() },
    create: { id: env.DEVICE_ID ?? 'doorbell', lastRingAt: new Date() },
  });
  if (userId) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'ring',
        message: 'Doorbell rang',
      },
    });
  }
  emitToClients('ring', { ts: new Date().toISOString(), clipId: null });
  res.json({ ok: true });
});

router.post('/events/motion', async (req, res) => {
  if (req.headers['x-device-key'] !== env.DEVICE_API_KEY) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const userId = (req.body.userId as string) ?? '';
  await prisma.deviceState.upsert({
    where: { id: env.DEVICE_ID ?? 'doorbell' },
    update: { lastMotionAt: new Date() },
    create: { id: env.DEVICE_ID ?? 'doorbell', lastMotionAt: new Date() },
  });
  if (userId) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'motion',
        message: 'Motion detected',
      },
    });
  }
  emitToClients('motion', { ts: new Date().toISOString() });
  res.json({ ok: true });
});

export default router;
