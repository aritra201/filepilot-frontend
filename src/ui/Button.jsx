const variants = {
  primary:
    'bg-primary-container text-white hover:bg-primary-container/90 border border-transparent shadow-sm',
  secondary:
    'bg-transparent border border-border text-on-surface hover:bg-surface-high',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-high hover:text-on-surface',
  danger: 'bg-destructive text-white hover:bg-destructive/90 border border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  loading,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
