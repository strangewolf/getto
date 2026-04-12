/** Escape and join a single CSV row. */
function csvRow(cells: unknown[]): string {
  return cells
    .map((v) => {
      const s = v === null || v === undefined ? "" : String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(",");
}

/** Trigger a CSV file download in the browser. */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const lines = [csvRow(headers), ...rows.map((r) => csvRow(r))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
