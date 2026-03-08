"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/form-controls";
import type { D1TableShape, R2BucketShape } from "@/lib/cloudflare/admin";
import type { R2ObjectSummary } from "@/lib/cloudflare/r2";

type TableRowsMap = Record<string, Array<Record<string, unknown>>>;
type BucketRowsMap = Record<string, R2ObjectSummary[]>;
type ErrorMap = Record<string, string>;
type LoadingMap = Record<string, boolean>;

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

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">D1 Tables</h2>
        {tables.map((table) => (
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
              <table className="min-w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ddcfbd] uppercase tracking-wide text-[color:var(--muted)]">
                    <th className="px-2 py-2">Column</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Not Null</th>
                    <th className="px-2 py-2">Primary Key</th>
                    <th className="px-2 py-2">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((column) => (
                    <tr key={`${table.name}-${column.cid}`} className="border-b border-[#efe3d3]">
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
              <pre className="overflow-x-auto rounded-lg bg-[#f8efe3] p-3 text-xs text-[color:var(--ink)]">
                {JSON.stringify(tableRows[table.name], null, 2)}
              </pre>
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
              <pre className="overflow-x-auto rounded-lg bg-[#f8efe3] p-3 text-xs text-[color:var(--ink)]">
                {JSON.stringify(bucketRows[bucket.name], null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
