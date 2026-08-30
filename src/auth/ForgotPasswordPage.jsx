import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthShell } from './AuthShell';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success('Check your email for the verification code.');
      navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start password reset'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we’ll send a verification code."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary-container hover:text-primary">
            Log in
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
        <Button type="submit" className="w-full" loading={loading}>
          Send code
        </Button>
      </form>
    </AuthShell>
  );
}
