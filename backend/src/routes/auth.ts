import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: true,
  path: '/',
  maxAge: env.SESSION_TTL_SECONDS * 1000,
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email and password are required' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.SESSION_TTL_SECONDS,
  });
  res
    .cookie('token', token, COOKIE_OPTIONS)
    .status(StatusCodes.OK)
    .json({ ok: true, user: { id: user.id, email: user.email } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' }).status(StatusCodes.OK).json({ ok: true });
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  res.json({ id: user.id, email: user.email });
});

export default router;
