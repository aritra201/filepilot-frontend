import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../api/client';
import { useAuth } from './AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function StyledFallback({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent py-2.5 text-sm font-medium text-on-surface transition-all duration-200 hover:bg-surface-high active:scale-[0.98]"
    >
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </button>
  );
}

function ConfiguredGoogleButton({ onSuccess }) {
  const { googleLogin } = useAuth();

  return (
    <div className="flex w-full justify-center [&>div]:w-full">
      <GoogleLogin
        theme="filled_black"
        size="large"
        width="356"
        text="continue_with"
        onSuccess={async (res) => {
          try {
            await googleLogin(res.credential);
            onSuccess?.();
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Google sign-in failed'));
          }
        }}
        onError={() => toast.error('Google sign-in was cancelled')}
      />
    </div>
  );
}

export function GoogleButton({ onSuccess }) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <StyledFallback onClick={() => toast.error('Google sign-in is not configured yet.')} />
    );
  }
  return <ConfiguredGoogleButton onSuccess={onSuccess} />;
}
