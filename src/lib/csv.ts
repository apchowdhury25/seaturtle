export type ProductImportRow = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  priceMinor: number;
  currency: string;
  categorySlug: string;
  color: string;
  size: string;
  stock: number;
  status: "draft" | "active";
};

export type ImportIssue = { row: number; message: string };

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseCsv(input: string): string[][] {
  return input
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseLine);
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (/[",\n]/.test(cell)) return `"${cell.replaceAll('"', '""')}"`;
          return cell;
        })
        .join(","),
    )
    .join("\n");
}

const REQUIRED = ["name", "slug", "sku", "price_minor", "currency", "category_slug", "color", "size", "stock"] as const;

export function validateProductImport(input: string): { rows: ProductImportRow[]; errors: ImportIssue[] } {
  const table = parseCsv(input);
  if (table.length === 0) return { rows: [], errors: [{ row: 1, message: "The file is empty." }] };
  const header = table[0].map((cell) => cell.toLowerCase());
  const missing = REQUIRED.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return { rows: [], errors: [{ row: 1, message: `Missing columns: ${missing.join(", ")}.` }] };
  }
  const index = new Map(header.map((column, position) => [column, position]));
  const rows: ProductImportRow[] = [];
  const errors: ImportIssue[] = [];
  const seen = new Set<string>();
  for (let line = 1; line < table.length; line += 1) {
    const cells = table[line];
    const read = (column: string) => cells[index.get(column) ?? -1] ?? "";
    const rowNumber = line + 1;
    const sku = read("sku");
    const price = Number(read("price_minor"));
    const stock = Number(read("stock"));
    const status = read("status") || "draft";
    const currency = read("currency").toUpperCase();
    if (!read("name") || !read("slug") || !sku) {
      errors.push({ row: rowNumber, message: "Name, slug, and SKU are required." });
      continue;
    }
    if (!Number.isSafeInteger(price) || price < 0) {
      errors.push({ row: rowNumber, message: "price_minor must be a non-negative integer." });
      continue;
    }
    if (!Number.isSafeInteger(stock) || stock < 0) {
      errors.push({ row: rowNumber, message: "stock must be a non-negative integer." });
      continue;
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      errors.push({ row: rowNumber, message: "currency must be a 3-letter code." });
      continue;
    }
    if (status !== "draft" && status !== "active") {
      errors.push({ row: rowNumber, message: "status must be draft or active." });
      continue;
    }
    if (seen.has(sku)) {
      errors.push({ row: rowNumber, message: `Duplicate SKU ${sku} in this file.` });
      continue;
    }
    seen.add(sku);
    rows.push({
      name: read("name"),
      slug: read("slug"),
      sku,
      description: read("description"),
      priceMinor: price,
      currency,
      categorySlug: read("category_slug"),
      color: read("color"),
      size: read("size"),
      stock,
      status,
    });
  }
  return { rows, errors };
}
