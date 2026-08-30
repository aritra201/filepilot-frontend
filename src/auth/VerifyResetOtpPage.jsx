import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { Button } from '../ui/Button';
import { AuthShell } from './AuthShell';
import { OtpInputs } from './OtpInputs';

export function VerifyResetOtpPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.verifyForgotPasswordOtp(email, otp);
      navigate(`/reset-password?token=${encodeURIComponent(data.token)}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authApi.resendForgotPasswordOtp(email);
      toast.success('A new code was sent to your email.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not resend code'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Enter reset code"
      subtitle={email ? `We sent a 6-digit code to ${email}.` : 'Enter the code from your email.'}
      footer={
        <Link to="/login" className="font-medium text-primary-container hover:text-primary">
          Back to login
        </Link>
      }
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <OtpInputs value={otp} onChange={setOtp} disabled={loading} />
        <Button type="submit" className="w-full" loading={loading} disabled={!email}>
          Continue
        </Button>
      </form>
      <button
        type="button"
        onClick={resend}
        disabled={resending || !email}
        className="mt-4 w-full text-sm text-primary-container hover:text-primary disabled:opacity-50"
      >
        {resending ? 'Sending…' : 'Resend code'}
      </button>
    </AuthShell>
  );
}
