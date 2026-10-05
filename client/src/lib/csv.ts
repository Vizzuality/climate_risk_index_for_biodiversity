export type CsvValue = string | number | null | undefined;

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => CsvValue;
};

const NEEDS_QUOTING = /[",\r\n]/;

const toField = (value: CsvValue) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return NEEDS_QUOTING.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const toLine = (fields: CsvValue[]) => `${fields.map(toField).join(",")}\r\n`;

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  return [
    toLine(columns.map((column) => column.header)),
    ...rows.map((row) => toLine(columns.map((column) => column.value(row)))),
  ].join("");
}

// The BOM makes Excel read the file as UTF-8 instead of the system code page.
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url));
}
