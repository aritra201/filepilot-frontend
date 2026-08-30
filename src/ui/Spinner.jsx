export function Spinner({ className = 'size-6' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-primary-container border-t-transparent ${className}`}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
