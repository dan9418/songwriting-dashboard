import { badRequest, notFound } from "@/lib/api/errors";
import { queryD1 } from "@/lib/cloudflare/d1";
import { listObjectSummaries, type R2ObjectSummary } from "@/lib/cloudflare/r2";

interface TableNameRow {
  name: string;
}

interface TableInfoRow {
  cid: number | string;
  name: string;
  type: string;
  notnull: number | string;
  dflt_value: unknown;
  pk: number | string;
}

interface ExistsRow {
  table_exists: number | string;
}

export interface D1TableColumnShape {
  cid: number;
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: unknown;
  isPrimaryKey: boolean;
}

export interface D1TableShape {
  name: string;
  columns: D1TableColumnShape[];
}

export interface R2BucketShape {
  name: string;
  fields: string[];
}

function toInt(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function assertSqlIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw badRequest(`Invalid SQL identifier: ${value}`);
  }
  return value;
}

function normalizeTableName(value: string): string {
  return assertSqlIdentifier(value.trim());
}

function configuredBucketNames(): string[] {
  const explicitList = (process.env.CLOUDFLARE_R2_BUCKETS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const single = (process.env.CLOUDFLARE_R2_BUCKET ?? "songwriting-media").trim();
  return Array.from(new Set([...explicitList, single]));
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await queryD1<ExistsRow>(
    `SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?) AS table_exists;`,
    [tableName]
  );
  return toInt(rows[0]?.table_exists ?? 0) === 1;
}

export async function listD1TableShapes(): Promise<D1TableShape[]> {
  const tableRows = await queryD1<TableNameRow>(
    `
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT GLOB '_cf_*'
    ORDER BY name ASC;
    `
  );

  const shapes = await Promise.all(
    tableRows.map(async (table) => {
      const name = normalizeTableName(table.name);
      const infoRows = await queryD1<TableInfoRow>(`PRAGMA table_info("${name}");`);
      return {
        name,
        columns: infoRows.map((column) => ({
          cid: toInt(column.cid),
          name: column.name,
          type: column.type,
          notNull: toInt(column.notnull) === 1,
          defaultValue: column.dflt_value,
          isPrimaryKey: toInt(column.pk) === 1
        }))
      } satisfies D1TableShape;
    })
  );

  return shapes;
}

export async function listD1TableData(
  tableName: string,
  limit = 100
): Promise<Array<Record<string, unknown>>> {
  const normalized = normalizeTableName(tableName);
  if (!(await tableExists(normalized))) {
    throw notFound(`Unknown table: ${normalized}`);
  }
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 100;
  return queryD1<Record<string, unknown>>(`SELECT * FROM "${normalized}" LIMIT ${safeLimit};`);
}

export function listR2BucketShapes(): R2BucketShape[] {
  return configuredBucketNames().map((name) => ({
    name,
    fields: ["key", "size", "etag", "lastModified", "storageClass"]
  }));
}

export async function listR2BucketData(bucketName: string, limit = 200): Promise<R2ObjectSummary[]> {
  const knownBuckets = configuredBucketNames();
  if (!knownBuckets.includes(bucketName)) {
    throw notFound(`Unknown bucket: ${bucketName}`);
  }
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(1000, Math.floor(limit))) : 200;
  return listObjectSummaries({ bucketName, limit: safeLimit });
}
