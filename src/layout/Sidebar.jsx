import { NavLink } from 'react-router-dom';
import { Cloud, LayoutDashboard, LogOut, Server, Settings, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useUiStore } from '../store/uiStore';

const links = [
  { to: '/servers', label: 'My Servers', icon: Server },
  { to: '/dashboard', label: 'Storage Dashboard', icon: LayoutDashboard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ mobile = false }) {
  const { logout } = useAuth();
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <aside
      className={`${
        mobile ? 'flex' : 'hidden md:flex'
      } fixed top-0 left-0 z-50 h-screen w-sidebar flex-col border-r border-border bg-surface py-8`}
    >
      <div className="mb-8 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary-container/20 text-primary">
            <Cloud className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">FilePilot</h1>
            <p className="text-xs font-medium tracking-wide text-text-muted">Remote Manager</p>
          </div>
        </div>
        {mobile && (
          <button
            type="button"
            className="text-on-surface-variant md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-r-lg px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'border-l-4 border-primary bg-secondary-container/10 text-primary'
                  : 'border-l-4 border-transparent text-on-surface-variant hover:bg-surface-high hover:text-on-surface'
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-r-lg border-l-4 border-transparent px-4 py-3 text-sm font-medium text-destructive hover:bg-surface-high"
        >
          <LogOut className="size-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
