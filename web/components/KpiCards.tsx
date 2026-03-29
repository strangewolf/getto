type Item = { label: string; value: string | number; hint?: string };

export function KpiCards({ items }: { items: Item[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{it.label}</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{it.value}</div>
          {it.hint ? <div className="mt-1 text-xs text-zinc-500">{it.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
