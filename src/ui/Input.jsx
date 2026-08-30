import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Input({
  label,
  hint,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && show ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={inputType}
          className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-on-surface placeholder:text-text-muted/60 outline-none transition-shadow focus:border-primary-container focus:shadow-[0_0_0_1px_#5B8CFF] ${
            error ? 'border-destructive' : 'border-border'
          } ${isPassword ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            onClick={() => setShow((v) => !v)}
          >
            {show ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
