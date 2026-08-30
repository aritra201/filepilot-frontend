import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthShell } from './AuthShell';
import { GoogleButton } from './GoogleButton';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const goHome = () => navigate('/servers', { replace: true });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      goHome();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        toast.error(apiErrorMessage(err, 'Please verify your email first.'));
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }
      toast.error(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Enter your details to access your servers."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-primary-container hover:text-primary">
            Sign up
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-on-surface-variant">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary-container hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="mt-2 w-full" loading={loading}>
          Log In
        </Button>
      </form>

      <div className="my-6 flex items-center">
        <div className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs text-on-surface-variant">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onSuccess={goHome} />
    </AuthShell>
  );
}
