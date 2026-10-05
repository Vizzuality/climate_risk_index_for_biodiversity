import { describe, expect, it } from "vitest";

import { type CsvColumn, toCsv } from "@/lib/csv";

type Row = { name: string; value: number | null | undefined };

const COLUMNS: CsvColumn<Row>[] = [
  { header: "name", value: (row) => row.name },
  { header: "value", value: (row) => row.value },
];

describe("toCsv", () => {
  it("writes the header row first and one CRLF-terminated line per row", () => {
    expect(toCsv([{ name: "Alpha", value: 0.123456789 }], COLUMNS)).toBe(
      "name,value\r\nAlpha,0.123456789\r\n",
    );
  });

  it("writes only the header row when there are no rows", () => {
    expect(toCsv([], COLUMNS)).toBe("name,value\r\n");
  });

  it("quotes fields containing commas, double quotes, or line breaks", () => {
    const rows = [
      { name: "Banc-des-Américains, zone 1", value: 1 },
      { name: 'The "Gully"', value: 2 },
      { name: "two\nlines", value: 3 },
      { name: "carriage\rreturn", value: 4 },
    ];

    expect(toCsv(rows, COLUMNS)).toBe(
      'name,value\r\n"Banc-des-Américains, zone 1",1\r\n"The ""Gully""",2\r\n"two\nlines",3\r\n"carriage\rreturn",4\r\n',
    );
  });

  it("writes null and undefined values as empty fields", () => {
    const rows = [
      { name: "Alpha", value: null },
      { name: "Bravo", value: undefined },
    ];

    expect(toCsv(rows, COLUMNS)).toBe("name,value\r\nAlpha,\r\nBravo,\r\n");
  });
});
