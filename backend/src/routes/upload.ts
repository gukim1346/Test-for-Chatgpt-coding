import { Router } from 'express';
import multer from 'multer';
import { StatusCodes } from 'http-status-codes';
import fs from 'fs/promises';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { persistFile } from '../services/storage.js';
import { emitToClients } from '../socket/device-socket.js';

fs.mkdir('tmp', { recursive: true }).catch(() => undefined);

const upload = multer({ dest: 'tmp' });
const router = Router();

router.post('/', upload.single('clip'), async (req, res) => {
  if (req.headers['x-device-key'] !== env.DEVICE_API_KEY) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  if (!req.file) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'clip is required' });
  }
  const { userId, durationSec = '0', sizeMB = '0', thumbUrl } = req.body as Record<string, string>;
  if (!userId) {
    await fs.unlink(req.file.path).catch(() => undefined);
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'userId is required' });
  }
  const { storagePath } = await persistFile(req.file.path, req.file.mimetype);
  const recording = await prisma.recording.create({
    data: {
      userId,
      durationSec: Number(durationSec) || 0,
      sizeMB: Number(sizeMB) || 0,
      thumbUrl,
      storagePath,
      mime: req.file.mimetype,
    },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: 'upload',
      message: 'New recording uploaded',
    },
  });
  emitToClients('uploadComplete', { clipId: recording.id, ts: new Date().toISOString() });
  await fs.unlink(req.file.path).catch(() => undefined);
  res.json({ ok: true, id: recording.id });
});

export default router;
