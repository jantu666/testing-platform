import type { RoleName } from '@/lib/api';

const order: RoleName[] = ['ADMIN', 'CREATOR', 'USER'];

export function RoleBadges({ roles }: { roles: RoleName[] }) {
  const sorted = [...roles].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return (
    <div className="flex flex-wrap gap-1">
      {sorted.map((r) => (
        <span
          key={r}
          className="rounded-full border border-forum-border bg-forum-card px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-forum-muted"
        >
          {r}
        </span>
      ))}
    </div>
  );
}
