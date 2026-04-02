"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import type { D1TableShape, R2BucketShape } from "@/lib/cloudflare/admin";
import type { R2ObjectSummary } from "@/lib/cloudflare/r2";

type TableRowsMap = Record<string, Array<Record<string, unknown>>>;
type BucketRowsMap = Record<string, R2ObjectSummary[]>;
type ErrorMap = Record<string, string>;
type LoadingMap = Record<string, boolean>;

const JOIN_TABLE_NAMES = new Set([
  "artist_images",
  "artist_external_links",
  "project_artists",
  "project_tracks",
  "project_images",
  "project_external_links",
  "track_artists",
  "track_external_links",
  "track_images"
]);

export function AdminConsole({
  tables,
  buckets
}: {
  tables: D1TableShape[];
  buckets: R2BucketShape[];
}) {
  const [tableRows, setTableRows] = useState<TableRowsMap>({});
  const [bucketRows, setBucketRows] = useState<BucketRowsMap>({});
  const [tableErrors, setTableErrors] = useState<ErrorMap>({});
  const [bucketErrors, setBucketErrors] = useState<ErrorMap>({});
  const [tableLoading, setTableLoading] = useState<LoadingMap>({});
  const [bucketLoading, setBucketLoading] = useState<LoadingMap>({});
  const [loadingAll, setLoadingAll] = useState(false);
  const coreTables = tables.filter((table) => !JOIN_TABLE_NAMES.has(table.name));
  const joinTables = tables.filter((table) => JOIN_TABLE_NAMES.has(table.name));

  async function loadTableRows(tableName: string) {
    setTableLoading((prev) => ({ ...prev, [tableName]: true }));
    setTableErrors((prev) => ({ ...prev, [tableName]: "" }));
    try {
      const response = await fetch(`/api/admin/d1/${encodeURIComponent(tableName)}`, { cache: "no-store" });
      const payload = (await response.json()) as { rows?: Array<Record<string, unknown>>; error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Failed to load table rows.");
      }
      setTableRows((prev) => ({ ...prev, [tableName]: payload.rows ?? [] }));
    } catch (error) {
      setTableErrors((prev) => ({
        ...prev,
        [tableName]: error instanceof Error ? error.message : "Failed to load table rows."
      }));
    } finally {
      setTableLoading((prev) => ({ ...prev, [tableName]: false }));
    }
  }

  async function loadBucketRows(bucketName: string) {
    setBucketLoading((prev) => ({ ...prev, [bucketName]: true }));
    setBucketErrors((prev) => ({ ...prev, [bucketName]: "" }));
    try {
      const response = await fetch(`/api/admin/r2/${encodeURIComponent(bucketName)}`, { cache: "no-store" });
      const payload = (await response.json()) as { objects?: R2ObjectSummary[]; error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Failed to load bucket objects.");
      }
      setBucketRows((prev) => ({ ...prev, [bucketName]: payload.objects ?? [] }));
    } catch (error) {
      setBucketErrors((prev) => ({
        ...prev,
        [bucketName]: error instanceof Error ? error.message : "Failed to load bucket objects."
      }));
    } finally {
      setBucketLoading((prev) => ({ ...prev, [bucketName]: false }));
    }
  }

  async function loadAllData() {
    setLoadingAll(true);
    try {
      await Promise.all([
        ...tables.map((table) => loadTableRows(table.name)),
        ...buckets.map((bucket) => loadBucketRows(bucket.name))
      ]);
    } finally {
      setLoadingAll(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="panel flex items-center justify-end p-4">
        <ActionButton disabled={loadingAll} onClick={loadAllData}>
          {loadingAll ? "Loading All..." : "Load All"}
        </ActionButton>
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">D1 Core Tables</h2>
        {coreTables.map((table) => (
          <div key={table.name} className="panel grid gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{table.name}</h3>
              <ActionButton
                disabled={tableLoading[table.name] === true}
                onClick={() => loadTableRows(table.name)}
              >
                {tableLoading[table.name] ? "Loading..." : "Load Data"}
              </ActionButton>
            </div>

            <div className="overflow-x-auto">
              <table className="theme-table text-xs">
                <thead>
                  <tr className="uppercase tracking-wide">
                    <th className="px-2 py-2">Column</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Not Null</th>
                    <th className="px-2 py-2">Primary Key</th>
                    <th className="px-2 py-2">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((column) => (
                    <tr key={`${table.name}-${column.cid}`}>
                      <td className="px-2 py-2">{column.name}</td>
                      <td className="px-2 py-2">{column.type || "-"}</td>
                      <td className="px-2 py-2">{column.notNull ? "yes" : "no"}</td>
                      <td className="px-2 py-2">{column.isPrimaryKey ? "yes" : "no"}</td>
                      <td className="px-2 py-2">{column.defaultValue === null ? "-" : String(column.defaultValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tableErrors[table.name] ? <p className="text-sm text-red-700">{tableErrors[table.name]}</p> : null}
            {tableRows[table.name] ? (
              <details className="theme-detail">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[color:var(--ink)]">
                  Loaded Data ({tableRows[table.name].length} rows)
                </summary>
                <pre className="theme-code-block overflow-x-auto p-3 text-xs text-[color:var(--ink)]">
                  {JSON.stringify(tableRows[table.name], null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">D1 Join Tables</h2>
        {joinTables.map((table) => (
          <div key={table.name} className="panel grid gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{table.name}</h3>
              <ActionButton
                disabled={tableLoading[table.name] === true}
                onClick={() => loadTableRows(table.name)}
              >
                {tableLoading[table.name] ? "Loading..." : "Load Data"}
              </ActionButton>
            </div>

            <div className="overflow-x-auto">
              <table className="theme-table text-xs">
                <thead>
                  <tr className="uppercase tracking-wide">
                    <th className="px-2 py-2">Column</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Not Null</th>
                    <th className="px-2 py-2">Primary Key</th>
                    <th className="px-2 py-2">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((column) => (
                    <tr key={`${table.name}-${column.cid}`}>
                      <td className="px-2 py-2">{column.name}</td>
                      <td className="px-2 py-2">{column.type || "-"}</td>
                      <td className="px-2 py-2">{column.notNull ? "yes" : "no"}</td>
                      <td className="px-2 py-2">{column.isPrimaryKey ? "yes" : "no"}</td>
                      <td className="px-2 py-2">{column.defaultValue === null ? "-" : String(column.defaultValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tableErrors[table.name] ? <p className="text-sm text-red-700">{tableErrors[table.name]}</p> : null}
            {tableRows[table.name] ? (
              <details className="theme-detail">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[color:var(--ink)]">
                  Loaded Data ({tableRows[table.name].length} rows)
                </summary>
                <pre className="theme-code-block overflow-x-auto p-3 text-xs text-[color:var(--ink)]">
                  {JSON.stringify(tableRows[table.name], null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">R2 Buckets</h2>
        {buckets.map((bucket) => (
          <div key={bucket.name} className="panel grid gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{bucket.name}</h3>
              <ActionButton
                disabled={bucketLoading[bucket.name] === true}
                onClick={() => loadBucketRows(bucket.name)}
              >
                {bucketLoading[bucket.name] ? "Loading..." : "Load Data"}
              </ActionButton>
            </div>

            <p className="text-xs text-[color:var(--muted)]">Object shape: {bucket.fields.join(", ")}</p>
            {bucketErrors[bucket.name] ? <p className="text-sm text-red-700">{bucketErrors[bucket.name]}</p> : null}
            {bucketRows[bucket.name] ? (
              <details className="theme-detail">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[color:var(--ink)]">
                  Loaded Data ({bucketRows[bucket.name].length} objects)
                </summary>
                <pre className="theme-code-block overflow-x-auto p-3 text-xs text-[color:var(--ink)]">
                  {JSON.stringify(bucketRows[bucket.name], null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
