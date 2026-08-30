import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthShell } from './AuthShell';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password, confirm);
      toast.success('Password reset. You can log in now.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Reset failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password that is at least 6 characters."
      footer={
        <Link to="/login" className="font-medium text-primary-container hover:text-primary">
          Back to login
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          id="new_password"
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Input
          id="confirm_password"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
        />
        <Button type="submit" className="w-full" loading={loading} disabled={!token}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
