import type { Server, Socket } from 'socket.io';
import prisma from '../config/prisma.js';
import env from '../config/env.js';

const DEVICE_ID = env.DEVICE_ID ?? 'doorbell';

let io: Server | null = null;

export const getIo = () => io;

export const emitToClients = (event: string, payload: unknown) => {
  io?.emit(event, payload);
};

export const registerSocketHandlers = (server: Server) => {
  io = server;
  server.on('connection', async (socket: Socket) => {
    const state = await prisma.deviceState.findUnique({ where: { id: DEVICE_ID } });
    if (state) {
      socket.emit('status', { led: state.led, servo: state.servo });
    }
    socket.on('unlock', async (_payload: { ms?: number }, callback?: (response: { ok: boolean }) => void) => {
      callback?.({ ok: true });
    });
    socket.on('led', async (payload: { on: boolean }, callback?: (response: { ok: boolean }) => void) => {
      const updated = await prisma.deviceState.upsert({
        where: { id: DEVICE_ID },
        update: { led: payload.on },
        create: { id: DEVICE_ID, led: payload.on },
      });
      emitToClients('status', { led: updated.led, servo: updated.servo });
      callback?.({ ok: true });
    });
    socket.on('servo', async (payload: { angle: number }, callback?: (response: { ok: boolean }) => void) => {
      const angle = Math.max(0, Math.min(180, Math.round(payload.angle)));
      const updated = await prisma.deviceState.upsert({
        where: { id: DEVICE_ID },
        update: { servo: angle },
        create: { id: DEVICE_ID, servo: angle },
      });
      emitToClients('status', { led: updated.led, servo: updated.servo });
      callback?.({ ok: true });
    });
  });
};
