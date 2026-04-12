"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  /** Extra classes on `<td>` (e.g. min-width for wide content). */
  cellClass?: string;
  /** When false, header is plain text and this column does not participate in sort. */
  sortable?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  pageSize?: number;
  /** When false (default), uses larger body text and padding. */
  dense?: boolean;
  onRowClick?: (row: T) => void;
  /** Applied to `<table>` (default `min-w-[32rem]`). */
  tableMinWidthClass?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  pageSize = 15,
  dense = false,
  onRowClick,
  tableMinWidthClass = "min-w-[32rem]",
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

  const cellPad = dense ? "px-2 py-2 sm:px-3" : "px-3 py-3.5 sm:px-4 sm:py-3.5";
  const headPad = dense ? "px-2 py-2.5 sm:px-3 sm:py-2" : "px-3 py-3.5 sm:px-4 sm:py-3";
  const textSize = dense ? "text-xs" : "text-sm";

  return (
    <div className="card-chamfer -mx-1 overflow-hidden shadow-sm sm:mx-0">
      <div className="overflow-x-auto">
        <table className={`w-full ${tableMinWidthClass} text-left ${textSize}`}>
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              {columns.map((c) => {
                const sortOn = c.sortable !== false;
                return (
                  <th
                    key={String(c.key)}
                    className={`whitespace-nowrap ${headPad} font-semibold text-zinc-700 dark:text-zinc-200`}
                  >
                    {sortOn ? (
                      <motion.button
                        type="button"
                        className="chamfer-control inline-flex items-center gap-1 px-2 py-1 text-inherit hover:text-primary-700 dark:hover:text-primary-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSort(String(c.key));
                        }}
                        whileTap={{ scale: 0.96 }}
                      >
                        {c.header}
                        {sortKey === String(c.key) ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </motion.button>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1">{c.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.03, delayChildren: 0.04 },
              },
            }}
          >
            {pageRows.map((row, i) => {
              const id = (row as { id?: string }).id;
              const rowKey = id ?? `p${page}-r${i}`;
              const clickable = Boolean(onRowClick);
              return (
                <motion.tr
                  key={rowKey}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
                    },
                  }}
                  className={`border-b border-zinc-100 odd:bg-white even:bg-zinc-50/80 dark:border-zinc-800 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/50 ${
                    clickable
                      ? "cursor-pointer transition-colors hover:bg-primary-950/20 dark:hover:bg-primary-950/25"
                      : ""
                  }`}
                  onClick={clickable ? () => onRowClick!(row) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick!(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                  role={clickable ? "button" : undefined}
                >
                  {columns.map((c) => (
                    <td
                      key={String(c.key)}
                      className={`${c.cellClass ?? "max-w-[14rem] sm:max-w-none"} ${cellPad} text-zinc-800 dark:text-zinc-100`}
                    >
                      {c.render ? (
                        onRowClick ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="presentation"
                          >
                            {c.render(row)}
                          </div>
                        ) : (
                          c.render(row)
                        )
                      ) : (
                        String((row as Record<string, unknown>)[c.key as string] ?? "")
                      )}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
      <div
        className={`flex flex-col gap-2 border-t border-zinc-200 px-3 py-3 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3 ${dense ? "text-xs" : "text-sm"}`}
      >
        <span className="text-center sm:text-left">
          {sorted.length} rows · page {page + 1}/{totalPages}
        </span>
        <div className="flex justify-center gap-2 sm:justify-end">
          <motion.button
            type="button"
            className="chamfer-control min-h-11 min-w-[4.5rem] border border-zinc-300 bg-white px-3 py-2 font-medium disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            whileTap={{ scale: 0.95 }}
          >
            Prev
          </motion.button>
          <motion.button
            type="button"
            className="chamfer-control min-h-11 min-w-[4.5rem] border border-zinc-300 bg-white px-3 py-2 font-medium disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            whileTap={{ scale: 0.95 }}
          >
            Next
          </motion.button>
        </div>
      </div>
    </div>
  );
}
