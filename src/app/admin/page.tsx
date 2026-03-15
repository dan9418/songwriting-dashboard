import { AdminConsole } from "@/app/admin/admin-console";
import { ThemeSystemPanel } from "@/app/admin/theme-system-panel";
import { AppIcon } from "@/components/ui/app-icons";
import { listD1TableShapes, listR2BucketShapes } from "@/lib/cloudflare/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    const [tables, buckets] = await Promise.all([listD1TableShapes(), Promise.resolve(listR2BucketShapes())]);

    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <div className="flex items-start gap-3">
            <span className="theme-icon-frame mt-0.5 h-12 w-12 shrink-0">
              <AppIcon name="admin" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Admin</h1>
              <p className="text-sm text-[color:var(--muted)]">
                Schema-first view. Use each section&apos;s button to load live data.
              </p>
            </div>
          </div>
        </div>
        <ThemeSystemPanel />
        <AdminConsole tables={tables} buckets={buckets} />
      </section>
    );
  } catch (error) {
    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <div className="flex items-start gap-3">
            <span className="theme-icon-frame mt-0.5 h-12 w-12 shrink-0">
              <AppIcon name="admin" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Admin</h1>
              <p className="text-sm text-[color:var(--muted)]">
                Failed to load admin schema.
                {error instanceof Error ? ` ${error.message}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
