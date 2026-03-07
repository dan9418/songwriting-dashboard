import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

export const dynamic = "force-dynamic";

const USER_SLUG = "dan";

function formatPath(value: string | null): string {
  return value && value.trim().length > 0 ? value : "-";
}

export default async function TracksPage() {
  try {
    const items = await listTracksFromCloudflare(USER_SLUG);

    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <h1 className="text-2xl font-semibold">Tracks</h1>
          <p className="text-sm text-[color:var(--muted)]">Showing {items.length} tracks for Dan.</p>
        </div>

        <div className="panel overflow-x-auto p-4">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#ddcfbd] text-xs uppercase tracking-wide text-[color:var(--muted)]">
                <th className="px-2 py-2 font-semibold">Slug</th>
                <th className="px-2 py-2 font-semibold">Project</th>
                <th className="px-2 py-2 font-semibold">Position</th>
                <th className="px-2 py-2 font-semibold">Audio</th>
                <th className="px-2 py-2 font-semibold">Lyrics Path</th>
                <th className="px-2 py-2 font-semibold">Notes Path</th>
                <th className="px-2 py-2 font-semibold">Chords Path</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.slug} className="border-b border-[#efe3d3] align-top">
                  <td className="px-2 py-2 font-medium text-[color:var(--ink)]">{item.slug}</td>
                  <td className="px-2 py-2">{item.projectSlug ?? "Unassigned"}</td>
                  <td className="px-2 py-2">{item.projectPosition ?? "-"}</td>
                  <td className="px-2 py-2">
                    {item.audioCount} total ({item.noteCount} note, {item.demoCount} demo, {item.liveCount} live)
                  </td>
                  <td className="px-2 py-2">{formatPath(item.lyricsPath)}</td>
                  <td className="px-2 py-2">{formatPath(item.notesPath)}</td>
                  <td className="px-2 py-2">{formatPath(item.chordsPath)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 ? (
            <p className="mt-3 text-sm text-[color:var(--muted)]">No tracks found.</p>
          ) : null}
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="grid gap-4">
        <div className="panel p-4">
          <h1 className="text-2xl font-semibold">Tracks</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Failed to load tracks from Cloudflare D1.
            {error instanceof Error ? ` ${error.message}` : ""}
          </p>
        </div>
      </section>
    );
  }
}
