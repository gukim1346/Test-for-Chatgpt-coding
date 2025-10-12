import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { NotificationBell } from './NotificationBell';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/recordings', label: 'Recordings' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/settings', label: 'Settings' },
];

export const AppLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <span className="text-xl font-semibold">Smart Doorbell</span>
            <nav className="hidden gap-4 md:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-indigo-600 ${isActive ? 'text-indigo-600' : 'text-slate-600'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-sm text-slate-600">{user?.email}</div>
            <button
              onClick={handleLogout}
              className="rounded bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-300 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
