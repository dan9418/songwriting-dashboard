import Link from "next/link";

export default function HomePage() {
  return (
    <section className="grid gap-4">
      <div className="panel overflow-hidden p-8">
        <p className="text-xs uppercase tracking-[0.15em] text-[color:var(--muted)]">Dan Bednarczyk's</p>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Songwriting Dashboard</h1>
        <p className="mt-3 max-w-2xl text-base text-[color:var(--muted)]">
          Metadata now loads from Cloudflare D1 and media is stored in R2. The archive, sandbox, search, and user
          sections have been removed as part of the refactor.
        </p>
      </div>

      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Tracks View</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          View all tracks and key metadata from the Cloudflare D1 datasource.
        </p>
        <div className="mt-4">
          <Link href="/tracks" className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-white transition hover:bg-[#0d675f]">
            Open Tracks
          </Link>
        </div>
      </div>
    </section>
  );
}
