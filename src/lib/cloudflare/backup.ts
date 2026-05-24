import { createHash } from "node:crypto";
import { listD1TableShapes, listR2BucketShapes, type D1TableShape } from "@/lib/cloudflare/admin";
import { queryD1 } from "@/lib/cloudflare/d1";
import {
  getBucketObjectStream,
  listAllObjectSummaries,
  type R2ObjectSummary
} from "@/lib/cloudflare/r2";

const EXCLUDED_TABLES = new Set(["d1_migrations"]);
const ZIP64_LIMIT = 0xffffffff;
const MANIFEST_PATH = "manifest.json";

type BackupKind = "text" | "media";

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
  kind: BackupKind;
  exportedAt: string;
  tableCount: number;
  tables: BackupTableManifest[];
  fileCount: number;
  files: BackupFileManifest[];
}

interface ZipEntryRecord {
  path: string;
  crc: number;
  size: number;
  offset: number;
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

function updateCrc32(current: number, body: Uint8Array): number {
  let crc = current;
  for (const byte of body) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return crc >>> 0;
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

function uint64(value: number): Buffer {
  const buffer = Buffer.allocUnsafe(8);
  buffer.writeBigUInt64LE(BigInt(value));
  return buffer;
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

function toCsvRows(rows: Array<Record<string, unknown>>, columns: string[]): string {
  if (rows.length === 0) {
    return "";
  }
  return `${rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")).join("\r\n")}\r\n`;
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

function isMarkdownObject(object: R2ObjectSummary): boolean {
  return /\.md$/i.test(object.key);
}

function isBackupArtifact(object: R2ObjectSummary): boolean {
  return /^backups\//i.test(object.key);
}

function backupObjectPath(kind: BackupKind, object: R2ObjectSummary): string {
  const key = object.key.replace(/^\/+/, "");
  if (kind === "text") {
    return `documents/${key}`;
  }
  if (/^tracks\/[^/]+\/audio\//i.test(key)) {
    return `media/audio/${key}`;
  }
  return `media/${key}`;
}

function createManifest(kind: BackupKind, exportedAt: string): BackupManifest {
  return {
    app: "songwriting-dashboard",
    kind,
    exportedAt,
    tableCount: 0,
    tables: [],
    fileCount: 0,
    files: []
  };
}

class StreamingZipWriter {
  private readonly controller: ReadableStreamDefaultController<Uint8Array>;
  private readonly entries: ZipEntryRecord[] = [];
  private readonly now = dosDateTime(new Date());
  private offset = 0;

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.controller = controller;
  }

  async addBuffer(path: string, body: Uint8Array): Promise<{ bytes: number; crc: number; sha256: string }> {
    const crc = (updateCrc32(0xffffffff, body) ^ 0xffffffff) >>> 0;
    const digest = sha256(body);
    return this.addEntry(path, body.byteLength, async () => {
      this.write(body);
      return { bytes: body.byteLength, crc, sha256: digest };
    });
  }

  async addStream(
    path: string,
    expectedSize: number,
    stream: ReadableStream<Uint8Array>
  ): Promise<{ bytes: number; crc: number; sha256: string }> {
    return this.addEntry(path, expectedSize, async () => {
      let crc = 0xffffffff;
      let bytes = 0;
      const hash = createHash("sha256");
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          crc = updateCrc32(crc, value);
          bytes += value.byteLength;
          hash.update(value);
          this.write(value);
        }
      } finally {
        reader.releaseLock();
      }

      return {
        bytes,
        crc: (crc ^ 0xffffffff) >>> 0,
        sha256: hash.digest("hex")
      };
    });
  }

  async addGenerated(
    path: string,
    writeBody: (writeChunk: (chunk: Uint8Array) => void) => Promise<{
      bytes: number;
      crc: number;
      sha256: string;
      rowCount: number;
    }>
  ): Promise<{ bytes: number; crc: number; sha256: string; rowCount: number }> {
    return this.addEntry(path, null, async () => writeBody((chunk) => this.write(chunk)));
  }

  async close(): Promise<void> {
    const centralDirectoryOffset = this.offset;
    const centralParts = this.entries.map((entry) => this.createCentralDirectoryHeader(entry));
    for (const part of centralParts) {
      this.write(part);
    }
    const centralDirectorySize = this.offset - centralDirectoryOffset;
    const zip64EndOffset = this.offset;
    this.write(this.createZip64EndRecord(centralDirectoryOffset, centralDirectorySize));
    this.write(this.createZip64Locator(zip64EndOffset));
    this.write(this.createEndRecord());
    this.controller.close();
  }

  private async addEntry<T extends { bytes: number; crc: number; sha256: string }>(
    path: string,
    expectedSize: number | null,
    writeBody: () => Promise<T>
  ): Promise<T> {
    const offset = this.offset;
    this.write(this.createLocalHeader(path, expectedSize));
    const result = await writeBody();
    if (expectedSize !== null && result.bytes !== expectedSize) {
      throw new Error(`Backup file size changed while exporting: ${path}`);
    }
    this.write(this.createDataDescriptor(result.crc, result.bytes));
    this.entries.push({ path, crc: result.crc, size: result.bytes, offset });
    return result;
  }

  private createLocalHeader(path: string, size: number | null): Buffer {
    const name = Buffer.from(path, "utf8");
    const extra = Buffer.concat([uint16(0x0001), uint16(16), uint64(size ?? 0), uint64(size ?? 0)]);
    return Buffer.concat([
      uint32(0x04034b50),
      uint16(45),
      uint16(0x0808),
      uint16(0),
      uint16(this.now.time),
      uint16(this.now.date),
      uint32(0),
      uint32(ZIP64_LIMIT),
      uint32(ZIP64_LIMIT),
      uint16(name.length),
      uint16(extra.length),
      name,
      extra
    ]);
  }

  private createDataDescriptor(crc: number, size: number): Buffer {
    return Buffer.concat([uint32(0x08074b50), uint32(crc), uint64(size), uint64(size)]);
  }

  private createCentralDirectoryHeader(entry: ZipEntryRecord): Buffer {
    const name = Buffer.from(entry.path, "utf8");
    const extra = Buffer.concat([uint16(0x0001), uint16(24), uint64(entry.size), uint64(entry.size), uint64(entry.offset)]);

    return Buffer.concat([
      uint32(0x02014b50),
      uint16(45),
      uint16(45),
      uint16(0x0808),
      uint16(0),
      uint16(this.now.time),
      uint16(this.now.date),
      uint32(entry.crc),
      uint32(ZIP64_LIMIT),
      uint32(ZIP64_LIMIT),
      uint16(name.length),
      uint16(extra.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(ZIP64_LIMIT),
      name,
      extra
    ]);
  }

  private createZip64EndRecord(centralDirectoryOffset: number, centralDirectorySize: number): Buffer {
    return Buffer.concat([
      uint32(0x06064b50),
      uint64(44),
      uint16(45),
      uint16(45),
      uint32(0),
      uint32(0),
      uint64(this.entries.length),
      uint64(this.entries.length),
      uint64(centralDirectorySize),
      uint64(centralDirectoryOffset)
    ]);
  }

  private createZip64Locator(zip64EndOffset: number): Buffer {
    return Buffer.concat([uint32(0x07064b50), uint32(0), uint64(zip64EndOffset), uint32(1)]);
  }

  private createEndRecord(): Buffer {
    return Buffer.concat([
      uint32(0x06054b50),
      uint16(0),
      uint16(0),
      uint16(Math.min(this.entries.length, 0xffff)),
      uint16(Math.min(this.entries.length, 0xffff)),
      uint32(ZIP64_LIMIT),
      uint32(ZIP64_LIMIT),
      uint16(0)
    ]);
  }

  private write(body: Uint8Array): void {
    this.offset += body.byteLength;
    this.controller.enqueue(body);
  }
}

async function addTextTables(writer: StreamingZipWriter, manifest: BackupManifest): Promise<void> {
  const tables = (await listD1TableShapes()).filter((table) => !EXCLUDED_TABLES.has(table.name));
  const pageSize = 1000;

  for (const table of tables) {
    const tableName = assertSqlIdentifier(table.name);
    const columns = table.columns.map((column) => column.name);
    const path = `tables/${table.name}.csv`;
    const result = await writer.addGenerated(path, async (writeChunk) => {
      let crc = 0xffffffff;
      let bytes = 0;
      let rowCount = 0;
      let offset = 0;
      const hash = createHash("sha256");

      function writeText(text: string): void {
        const body = encodeText(text);
        crc = updateCrc32(crc, body);
        bytes += body.byteLength;
        hash.update(body);
        writeChunk(body);
      }

      writeText(`${columns.map(csvCell).join(",")}\r\n`);

      while (true) {
        const rows = await queryD1<Record<string, unknown>>(
          `SELECT * FROM "${tableName}"${orderClause(table)} LIMIT ${pageSize} OFFSET ${offset};`
        );
        if (rows.length === 0) {
          break;
        }
        writeText(toCsvRows(rows, columns));
        rowCount += rows.length;
        offset += rows.length;
      }

      return {
        bytes,
        crc: (crc ^ 0xffffffff) >>> 0,
        sha256: hash.digest("hex"),
        rowCount
      };
    });
    manifest.tables.push({
      name: table.name,
      path,
      rowCount: result.rowCount,
      sha256: result.sha256,
      bytes: result.bytes
    });
  }

  manifest.tableCount = manifest.tables.length;
}

async function addR2Files(writer: StreamingZipWriter, manifest: BackupManifest, kind: BackupKind): Promise<void> {
  const buckets = listR2BucketShapes();

  for (const bucket of buckets) {
    const objects = await listAllObjectSummaries({ bucketName: bucket.name });
    const selectedObjects = objects.filter((object) => {
      if (isBackupArtifact(object)) {
        return false;
      }
      return kind === "text" ? isMarkdownObject(object) : !isMarkdownObject(object);
    });

    for (const object of selectedObjects) {
      const data = await getBucketObjectStream(bucket.name, object.key);
      if (!data) {
        continue;
      }
      const path = backupObjectPath(kind, object);
      const result = await writer.addStream(path, object.size, data.body);
      manifest.files.push({
        bucket: bucket.name,
        sourceKey: object.key,
        path,
        contentType: data.contentType,
        etag: data.etag,
        sourceSize: object.size,
        bytes: result.bytes,
        sha256: result.sha256,
        lastModified: object.lastModified
      });
    }
  }

  manifest.fileCount = manifest.files.length;
}

async function writeBackup(
  writer: StreamingZipWriter,
  kind: BackupKind,
  exportedAt: string
): Promise<void> {
  const manifest = createManifest(kind, exportedAt);

  if (kind === "text") {
    await addTextTables(writer, manifest);
  }
  await addR2Files(writer, manifest, kind);

  const manifestBody = encodeText(`${JSON.stringify(manifest, null, 2)}\n`);
  await writer.addBuffer(MANIFEST_PATH, manifestBody);
  await writer.close();
}

export function createBackupZipStream(kind: BackupKind): { fileName: string; stream: ReadableStream<Uint8Array> } {
  const exportedAt = new Date().toISOString();
  const stamp = exportedAt.replace(/[:.]/g, "-");
  const fileName = `songwriting-dashboard-${kind}-backup-${stamp}.zip`;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const writer = new StreamingZipWriter(controller);
      writeBackup(writer, kind, exportedAt).catch((error: unknown) => {
        controller.error(error);
      });
    }
  });

  return { fileName, stream };
}
