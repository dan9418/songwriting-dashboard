import Link from "next/link";
import { ActionButton } from "@/components/ui/form-controls";

export default function HomePage() {
  return (
    <section className="grid gap-4">
      <div className="panel overflow-hidden p-8">
        <p className="text-xs uppercase tracking-[0.15em] text-[color:var(--muted)]">Dan Bednarczyk's</p>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Songwriting Dashboard</h1>
        <p className="mt-3 max-w-2xl text-base text-[color:var(--muted)]">
          Organize tracks, projects, and fragments from your filesystem while keeping markdown frontmatter as the
          single source of truth.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/archive">
            <ActionButton>Open Archive</ActionButton>
          </Link>
          <Link href="/sandbox">
            <ActionButton tone="ghost">Open Sandbox</ActionButton>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Archive</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Browse artists and projects in a clean hierarchy.</p>
        </div>
        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Sandbox</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Capture drafts fast and evolve metadata over time.</p>
        </div>
        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Search</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Jump directly to tracks, projects, and fragments.</p>
        </div>
      </div>
    </section>
  );
}
