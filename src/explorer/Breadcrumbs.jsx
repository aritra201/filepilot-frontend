import { ChevronRight } from 'lucide-react';
import { basename, joinPath, MNT_ROOT, pathSegments } from '../utils/paths';

export function Breadcrumbs({ serverLabel, path, onNavigate }) {
  const segs = pathSegments(path);
  const crumbs = segs.map((seg, i) => ({
    label: i === 0 ? serverLabel || 'mnt' : seg,
    path: `/${segs.slice(0, i + 1).join('/')}`,
  }));

  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
      <button
        type="button"
        className="hover:text-primary"
        onClick={() => onNavigate(MNT_ROOT)}
      >
        {serverLabel || 'Server'}
      </button>
      {crumbs.slice(1).map((crumb, i) => {
        const last = i === crumbs.slice(1).length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-2">
            <ChevronRight className="size-4" />
            {last ? (
              <span className="font-medium text-on-surface">{crumb.label}</span>
            ) : (
              <button type="button" className="hover:text-primary" onClick={() => onNavigate(crumb.path)}>
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
      {path === MNT_ROOT && (
        <>
          <ChevronRight className="size-4" />
          <span className="font-medium text-on-surface">{basename(joinPath(MNT_ROOT))}</span>
        </>
      )}
    </nav>
  );
}
