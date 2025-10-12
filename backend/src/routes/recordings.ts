import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { parseISO, isValid } from 'date-fns';
import type { Prisma, Recording } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { getSignedUrl } from '../services/storage.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const { from, to, q, page = '1' } = req.query;
  const pageNumber = Number(page) || 1;
  const take = 20;
  const skip = (pageNumber - 1) * take;

  const filters: Prisma.RecordingWhereInput = { userId: req.userId };
  const createdAtFilter: Prisma.DateTimeFilter = {};

  if (from && typeof from === 'string') {
    const parsed = parseISO(from);
    if (isValid(parsed)) {
      createdAtFilter.gte = parsed;
    }
  }
  if (to && typeof to === 'string') {
    const parsed = parseISO(to);
    if (isValid(parsed)) {
      createdAtFilter.lte = parsed;
    }
  }

  if (Object.keys(createdAtFilter).length > 0) {
    filters.createdAt = createdAtFilter;
  }
  if (q && typeof q === 'string' && q.trim()) {
    filters.OR = [
      { storagePath: { contains: q, mode: 'insensitive' } },
      { thumbUrl: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.recording.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.recording.count({ where: filters }),
  ]);

  const nextPageToken = skip + items.length < total ? String(pageNumber + 1) : null;

  res.json({
    items: items.map((item: Recording) => ({
      id: item.id,
      createdAt: item.createdAt,
      durationSec: item.durationSec,
      thumbUrl: item.thumbUrl,
      sizeMB: item.sizeMB,
    })),
    nextPageToken,
  });
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const recording = await prisma.recording.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!recording) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Recording not found' });
  }
  const url = await getSignedUrl(recording.storagePath);
  res.json({ id: recording.id, createdAt: recording.createdAt, url, mime: recording.mime });
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const recording = await prisma.recording.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!recording) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Recording not found' });
  }
  await prisma.recording.delete({ where: { id: recording.id } });
  res.json({ ok: true });
});

export default router;
