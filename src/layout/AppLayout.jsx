import { Outlet } from 'react-router-dom';
import { ReconnectModal } from '../servers/ReconnectModal';
import { useUiStore } from '../store/uiStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { TransferTrayStack } from '../explorer/TransferTrayStack';

export function AppLayout() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      {sidebarOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar mobile />
        </>
      )}
      <div className="flex min-h-screen flex-col md:ml-sidebar">
        <TopBar />
        <main className="flex-1 pt-16">
          <Outlet />
        </main>
      </div>
      <ReconnectModal />
      <TransferTrayStack />
    </div>
  );
}
