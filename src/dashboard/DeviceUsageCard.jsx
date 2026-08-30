import { ArrowRight, HardDrive, Usb } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { formatBytes, formatRelative } from '../utils/format';
import { CATEGORY_COLORS } from '../utils/fileTypes';
import { basename } from '../utils/paths';

const LEGEND = [
  { key: 'video', label: 'Video', color: CATEGORY_COLORS.video },
  { key: 'image', label: 'Photos', color: CATEGORY_COLORS.photos },
  { key: 'docs', label: 'Docs', color: CATEGORY_COLORS.docs },
  { key: 'audio', label: 'Audio', color: CATEGORY_COLORS.audio },
  { key: 'other', label: 'Other', color: CATEGORY_COLORS.other },
];

export function DeviceUsageCard({ device, onViewFiles }) {
  const total = Number(device.total_bytes) || 0;
  const used = Number(device.used_bytes) || 0;
  const free = Number(device.free_bytes) || Math.max(total - used, 0);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const warning = pct >= 90;
  const breakdown = device.category_breakdown || {};

  const slices = LEGEND.map((item) => ({
    name: item.label,
    value: Number(breakdown[item.key] || breakdown[item.key === 'image' ? 'photos' : item.key] || 0),
    color: item.color,
  })).filter((s) => s.value > 0);

  const chartData = [...slices, { name: 'Free', value: free, color: '#282a2e' }];
  const name = basename(device.device_path);
  const Icon = name.toLowerCase().includes('usb') || name.toLowerCase().includes('pendrive')
    ? Usb
    : HardDrive;

  return (
    <div
      className={`interactive-card relative flex flex-col overflow-hidden rounded-2xl border bg-surface p-6 lg:flex-row lg:gap-8 ${
        warning ? 'border-error/30 ring-1 ring-error/20' : 'border-border'
      }`}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="flex min-w-[200px] flex-1 flex-col items-center justify-center">
        <div className="mb-6 flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={warning ? 'text-error' : 'text-primary'} size={20} />
            <h4 className="text-lg font-semibold text-on-surface">{name}</h4>
          </div>
          <span className="rounded border border-border bg-surface-high px-2 py-1 font-mono text-[13px] text-text-muted">
            {device.device_path}
          </span>
        </div>
        <div className="relative size-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={58}
                outerRadius={76}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-semibold ${warning ? 'text-error' : 'text-on-surface'}`}>
              {pct}%
            </span>
            <span className={`text-xs ${warning ? 'text-error/80' : 'text-text-muted'}`}>Used</span>
          </div>
        </div>
        <div className="mt-4 flex w-full justify-between text-sm">
          <span className="text-on-surface">{formatBytes(used)}</span>
          <span className="text-text-muted">{formatBytes(total)} Total</span>
        </div>
        {device.scanned_at && (
          <p className="mt-2 text-xs text-text-muted">Updated {formatRelative(device.scanned_at)}</p>
        )}
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-center border-t border-border pt-6 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        <div className="flex-1 space-y-4">
          {LEGEND.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full" style={{ background: item.color }} />
                <span className="text-on-surface-variant">{item.label}</span>
              </div>
              <span className="font-mono text-[13px] text-on-surface">
                {formatBytes(breakdown[item.key] || 0)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full border border-border bg-surface-high" />
              <span className="text-on-surface-variant">Free</span>
            </div>
            <span className={`font-mono text-[13px] ${warning ? 'text-error' : 'text-text-muted'}`}>
              {formatBytes(free)}
            </span>
          </div>
        </div>
        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={() => onViewFiles(device.device_path)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
          >
            View Files
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
