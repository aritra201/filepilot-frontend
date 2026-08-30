export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-high text-text-muted">
          <Icon className="size-6" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
