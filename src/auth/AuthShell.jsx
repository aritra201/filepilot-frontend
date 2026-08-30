import { Cloud } from 'lucide-react';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-on-surface">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(91, 140, 255, 0.08) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(91, 140, 255, 0.05) 0%, transparent 40%)',
        }}
      />
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary-container/10 blur-[120px]" />

      <main className="relative z-10 flex w-full max-w-[420px] flex-col items-center">
        <div className="mb-8 flex items-center gap-3">
          <Cloud className="size-8 text-primary-container" />
          <h1 className="text-[32px] leading-10 font-bold tracking-tight text-on-surface">
            FilePilot
          </h1>
        </div>

        <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-on-surface">{title}</h2>
          {subtitle && <p className="mb-6 text-sm text-on-surface-variant">{subtitle}</p>}
          {children}
        </div>

        {footer && <p className="mt-8 text-sm text-on-surface-variant">{footer}</p>}
      </main>
    </div>
  );
}
