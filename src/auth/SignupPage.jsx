import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthShell } from './AuthShell';
import { GoogleButton } from './GoogleButton';
import { useAuth } from './AuthContext';

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, password, display_name: displayName });
      toast.success('Check your email for the verification code.');
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Set up FilePilot to manage your home server."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-container hover:text-primary">
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          id="display_name"
          label="Display name"
          placeholder="Ada Lovelace"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
        />
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Button type="submit" className="mt-2 w-full" loading={loading}>
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center">
        <div className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs text-on-surface-variant">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onSuccess={() => navigate('/servers', { replace: true })} />
    </AuthShell>
  );
}
