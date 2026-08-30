import { useRef } from 'react';

export function OtpInputs({ value, onChange, disabled }) {
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');
  const refs = useRef([]);

  const focusAt = (i) => refs.current[i]?.focus();

  const setDigit = (index, char) => {
    const next = value.split('');
    while (next.length < 6) next.push('');
    next[index] = char;
    onChange(next.join('').replace(/\s/g, '').slice(0, 6));
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digit === ' ' ? '' : digit}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, '').slice(-1);
            if (!char) {
              setDigit(i, '');
              return;
            }
            setDigit(i, char);
            if (i < 5) focusAt(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) {
              setDigit(i - 1, '');
              focusAt(i - 1);
            }
            if (e.key === 'ArrowLeft' && i > 0) focusAt(i - 1);
            if (e.key === 'ArrowRight' && i < 5) focusAt(i + 1);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (pasted) onChange(pasted);
          }}
          className="h-12 w-11 rounded-lg border border-border bg-background text-center text-lg font-semibold text-on-surface outline-none focus:border-primary-container focus:shadow-[0_0_0_1px_#5B8CFF]"
        />
      ))}
    </div>
  );
}
