"use client";

import { useMemo, useState } from "react";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  pageSize?: number;
  dense?: boolean;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  pageSize = 15,
  dense = true,
}: Props<T>) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey as keyof T];
      const bv = b[sortKey as keyof T];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const c = av < bv ? -1 : 1;
      return sortDir === "asc" ? c : -c;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="-mx-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm sm:mx-0 dark:border-zinc-800 dark:bg-zinc-950">
      <table
        className={`w-full min-w-[32rem] text-left ${dense ? "text-xs" : "text-sm"}`}
      >
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <tr>
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className="whitespace-nowrap px-2 py-2.5 font-semibold text-zinc-700 sm:px-3 sm:py-2 dark:text-zinc-200"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-emerald-700"
                  onClick={() => toggleSort(String(c.key))}
                >
                  {c.header}
                  {sortKey === String(c.key)
                    ? sortDir === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-zinc-100 odd:bg-white even:bg-zinc-50/80 dark:border-zinc-800 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/50"
            >
              {columns.map((c) => (
                <td
                  key={String(c.key)}
                  className="max-w-[12rem] px-2 py-2.5 text-zinc-800 sm:max-w-none sm:px-3 sm:py-2 dark:text-zinc-100"
                >
                  {c.render
                    ? c.render(row)
                    : String(
                        (row as Record<string, unknown>)[c.key as string] ?? "",
                      )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col gap-2 border-t border-zinc-200 px-2 py-3 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-2 dark:border-zinc-800 dark:text-zinc-400">
        <span className="text-center sm:text-left">
          {sorted.length} rows · page {page + 1}/{totalPages}
        </span>
        <div className="flex justify-center gap-2 sm:justify-end">
          <button
            type="button"
            className="min-h-11 min-w-[4.5rem] rounded-lg border border-zinc-300 px-3 py-2 font-medium disabled:opacity-40 dark:border-zinc-600 sm:min-h-0 sm:min-w-0 sm:px-2 sm:py-1"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="min-h-11 min-w-[4.5rem] rounded-lg border border-zinc-300 px-3 py-2 font-medium disabled:opacity-40 dark:border-zinc-600 sm:min-h-0 sm:min-w-0 sm:px-2 sm:py-1"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
