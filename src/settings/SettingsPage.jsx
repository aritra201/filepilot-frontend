import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useUiStore } from '../store/uiStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { initials } from '../utils/format';

export function SettingsPage() {
  const { user } = useAuth();
  const setPageTitle = useUiStore((s) => s.setPageTitle);
  const setShowSearch = useUiStore((s) => s.setShowSearch);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPageTitle('Settings');
    setShowSearch(false);
  }, [setPageTitle, setShowSearch]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({
        current_password: current,
        new_password: next,
        confirm_password: confirm,
      });
      toast.success('Password changed');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-6">
        <div className="size-14 overflow-hidden rounded-full border border-border">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-primary-container/20 text-lg font-semibold text-primary">
              {initials(user?.display_name, user?.email)}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-on-surface">{user?.display_name || 'Account'}</h3>
          <p className="text-sm text-text-muted">{user?.email}</p>
          <p className="mt-1 text-xs capitalize text-on-surface-variant">
            {user?.auth_provider || 'local'} account
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-semibold text-on-surface">Change password</h3>
        <div className="space-y-4">
          <Input
            id="current_password"
            label="Current password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <Input
            id="new_password"
            label="New password"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={6}
          />
          <Input
            id="confirm_password"
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="mt-6" loading={loading}>
          Update password
        </Button>
      </form>
    </div>
  );
}
