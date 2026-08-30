import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border border-border bg-surface p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title && <h3 className="text-lg font-semibold text-on-surface">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-text-muted hover:bg-surface-high hover:text-on-surface"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
