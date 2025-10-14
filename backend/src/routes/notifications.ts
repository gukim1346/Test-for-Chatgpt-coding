import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const { page = '1' } = req.query;
  const pageNumber = Number(page) || 1;
  const take = 20;
  const skip = (pageNumber - 1) * take;
  const items = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
  const total = await prisma.notification.count({ where: { userId: req.userId } });
  const nextPageToken = skip + items.length < total ? String(pageNumber + 1) : null;
  res.json({ items, nextPageToken });
});

router.post('/:id/read', async (req: AuthenticatedRequest, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { read: true },
  });
  res.json({ ok: true });
});

export default router;
