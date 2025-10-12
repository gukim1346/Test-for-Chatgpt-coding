import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      setSocket((current) => {
        current?.disconnect();
        return null;
      });
      return;
    }
    const instance = io(import.meta.env.VITE_API_BASE ?? '', {
      path: '/socket.io/',
      transports: ['websocket'],
      withCredentials: true,
    });
    setSocket(instance);
    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
