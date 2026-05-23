import { createHash } from "node:crypto";
import { listD1TableShapes, listR2BucketShapes, type D1TableShape } from "@/lib/cloudflare/admin";
import { queryD1 } from "@/lib/cloudflare/d1";
import {
  getBucketObjectData,
  listAllObjectSummaries,
  type R2ObjectSummary
} from "@/lib/cloudflare/r2";

const EXCLUDED_TABLES = new Set(["d1_migrations"]);

interface BackupTableManifest {
  name: string;
  path: string;
  rowCount: number;
  sha256: string;
  bytes: number;
}

interface BackupFileManifest {
  bucket: string;
  sourceKey: string;
  path: string;
  contentType: string | null;
  etag: string | null;
  sourceSize: number;
  bytes: number;
  sha256: string;
  lastModified: string | null;
}

interface BackupManifest {
  app: string;
  exportedAt: string;
  tableCount: number;
  tables: BackupTableManifest[];
  fileCount: number;
  files: BackupFileManifest[];
}

interface ZipEntry {
  path: string;
  body: Uint8Array;
}

const CRC32_TABLE = new Uint32Array(256);

for (let index = 0; index < CRC32_TABLE.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC32_TABLE[index] = value >>> 0;
}

function assertSqlIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }
  return value;
}

function encodeText(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function sha256(body: Uint8Array): string {
  return createHash("sha256").update(body).digest("hex");
}

function crc32(body: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of body) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { date: number; time: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  };
}

function uint16(value: number): Buffer {
  const buffer = Buffer.allocUnsafe(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function uint32(value: number): Buffer {
  const buffer = Buffer.allocUnsafe(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

function createZip(entries: ZipEntry[]): Uint8Array {
  const now = dosDateTime(new Date());
  const fileParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    const body = Buffer.from(entry.body);
    const checksum = crc32(body);
    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(now.time),
      uint16(now.date),
      uint32(checksum),
      uint32(body.length),
      uint32(body.length),
      uint16(name.length),
      uint16(0),
      name
    ]);

    fileParts.push(localHeader, body);

    centralParts.push(
      Buffer.concat([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(now.time),
        uint16(now.date),
        uint32(checksum),
        uint32(body.length),
        uint32(body.length),
        uint16(name.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        name
      ])
    );

    offset += localHeader.length + body.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(entries.length),
    uint16(entries.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0)
  ]);

  return Buffer.concat([...fileParts, centralDirectory, endRecord]);
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const text = typeof value === "string" ? value : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

function orderClause(table: D1TableShape): string {
  const primaryKeyColumns = table.columns
    .filter((column) => column.isPrimaryKey)
    .map((column) => `"${assertSqlIdentifier(column.name)}"`);
  const columns = primaryKeyColumns.length > 0
    ? primaryKeyColumns
    : table.columns.map((column) => `"${assertSqlIdentifier(column.name)}"`);
  return columns.length > 0 ? ` ORDER BY ${columns.join(", ")}` : "";
}

function backupObjectPath(object: R2ObjectSummary): string {
  const key = object.key.replace(/^\/+/, "");
  if (/\.md$/i.test(key)) {
    return `documents/${key}`;
  }
  if (/^tracks\/[^/]+\/audio\//i.test(key)) {
    return `media/audio/${key}`;
  }
  return `media/${key}`;
}

async function addTableEntries(entries: ZipEntry[], manifest: BackupManifest): Promise<void> {
  const tables = (await listD1TableShapes()).filter((table) => !EXCLUDED_TABLES.has(table.name));

  for (const table of tables) {
    const tableName = assertSqlIdentifier(table.name);
    const columns = table.columns.map((column) => column.name);
    const rows = await queryD1<Record<string, unknown>>(`SELECT * FROM "${tableName}"${orderClause(table)};`);
    const body = encodeText(toCsv(rows, columns));
    const path = `tables/${table.name}.csv`;
    entries.push({ path, body });
    manifest.tables.push({
      name: table.name,
      path,
      rowCount: rows.length,
      sha256: sha256(body),
      bytes: body.byteLength
    });
  }

  manifest.tableCount = manifest.tables.length;
}

async function addR2Entries(entries: ZipEntry[], manifest: BackupManifest): Promise<void> {
  const buckets = listR2BucketShapes();

  for (const bucket of buckets) {
    const objects = await listAllObjectSummaries({ bucketName: bucket.name });

    for (const object of objects) {
      const data = await getBucketObjectData(bucket.name, object.key);
      if (!data) {
        continue;
      }

      const path = backupObjectPath(object);
      const body = data.body;
      entries.push({ path, body });
      manifest.files.push({
        bucket: bucket.name,
        sourceKey: object.key,
        path,
        contentType: data.contentType,
        etag: data.etag,
        sourceSize: object.size,
        bytes: body.byteLength,
        sha256: sha256(body),
        lastModified: object.lastModified
      });
    }
  }

  manifest.fileCount = manifest.files.length;
}

export async function createFullBackupZip(): Promise<{ fileName: string; body: Uint8Array }> {
  const exportedAt = new Date().toISOString();
  const stamp = exportedAt.replace(/[:.]/g, "-");
  const root = `songwriting-dashboard-backup-${stamp}`;
  const entries: ZipEntry[] = [];
  const manifest: BackupManifest = {
    app: "songwriting-dashboard",
    exportedAt,
    tableCount: 0,
    tables: [],
    fileCount: 0,
    files: []
  };

  await addTableEntries(entries, manifest);
  await addR2Entries(entries, manifest);

  const manifestBody = encodeText(`${JSON.stringify(manifest, null, 2)}\n`);
  entries.unshift({
    path: "manifest.json",
    body: manifestBody
  });

  const body = createZip(entries.map((entry) => ({
    path: `${root}/${entry.path}`,
    body: entry.body
  })));

  return {
    fileName: `${root}.zip`,
    body
  };
}
