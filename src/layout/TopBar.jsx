import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useUiStore } from '../store/uiStore';
import { initials } from '../utils/format';

export function TopBar({ actions }) {
  const { user } = useAuth();
  const pageTitle = useUiStore((s) => s.pageTitle);
  const showSearch = useUiStore((s) => s.showSearch);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <header className="fixed top-0 right-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md md:w-[calc(100%-260px)] md:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          className="text-on-surface-variant hover:text-primary md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-6" />
        </button>
        <h2 className="hidden truncate text-2xl font-semibold tracking-tight text-on-surface md:block">
          {pageTitle}
        </h2>
        {showSearch && (
          <div className="hidden items-center rounded-full border border-border bg-surface-low px-4 py-1.5 focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container lg:flex lg:w-96">
            <Search className="mr-2 size-4 text-on-surface-variant" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files, folders..."
              className="h-7 w-full border-none bg-transparent p-0 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div id="topbar-actions" className="hidden items-center gap-3 md:flex" />
        {actions}
        <div className="flex items-center gap-3 border-l border-border pl-4">
          <button
            type="button"
            className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-highest hover:text-primary"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
          </button>
          <div className="size-8 overflow-hidden rounded-full border border-border">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary-container/20 text-xs font-semibold text-primary">
                {initials(user?.display_name, user?.email)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
