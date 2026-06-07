// CSV-Export: wandelt Objekte in eine CSV-Datei und löst den Download aus.
// Excel-freundlich: Semikolon als Trenner, UTF-8-BOM, Werte sauber escaped.

function escape(val) {
  const s = val == null ? '' : String(val);
  return /[";\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
}

// columns: [{ key, label }]
export function toCsv(rows, columns) {
  const kopf = columns.map((c) => escape(c.label)).join(';');
  const zeilen = rows.map((r) => columns.map((c) => escape(typeof c.wert === 'function' ? c.wert(r) : r[c.key])).join(';'));
  return [kopf, ...zeilen].join('\r\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
