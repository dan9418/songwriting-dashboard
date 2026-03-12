import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";
import { MarkdownDocCard } from "@/app/tracks/[trackSlug]/markdown-doc-card";

export const dynamic = "force-dynamic";

function formatDateForTable(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  const yearTwo = year.slice(-2);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (!Number.isInteger(monthNumber) || !Number.isInteger(dayNumber)) {
    return value;
  }
  return `${monthNumber}/${dayNumber}/${yearTwo}`;
}

export default async function TrackByIdPage({
  params
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  const track = await getTrackMetadataFromCloudflare(trackSlug);

  if (!track) {
    notFound();
  }

  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">{track.name}</h1>
          <p className="text-sm text-[color:var(--muted)]">{track.slug}</p>
        </div>
        <Link
          href="/tracks"
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back To Tracks
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MarkdownDocCard trackSlug={track.slug} type="lyrics" />
        <MarkdownDocCard trackSlug={track.slug} type="chords" />
        <MarkdownDocCard trackSlug={track.slug} type="notes" />
      </div>

      <div className="panel overflow-x-auto p-4">
        <h2 className="text-lg font-semibold">Audio</h2>
        <table className="mt-3 min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddcfbd] text-xs uppercase tracking-wide text-[color:var(--muted)]">
              <th className="px-2 py-2 font-semibold">Filename</th>
              <th className="px-2 py-2 font-semibold">Version</th>
              <th className="px-2 py-2 font-semibold">Description</th>
              <th className="px-2 py-2 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {track.audio.map((audioItem) => (
              <tr key={audioItem.slug} className="border-b border-[#efe3d3]">
                <td className="px-2 py-2">
                  {audioItem.fileHref ? (
                    <a
                      href={audioItem.fileHref}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-[#ccb089] underline-offset-4 hover:text-[color:var(--accent)]"
                    >
                      {audioItem.fileName}
                    </a>
                  ) : (
                    audioItem.fileName
                  )}
                </td>
                <td className="px-2 py-2">{`${audioItem.type} v${audioItem.typeVersion}`}</td>
                <td className="px-2 py-2">{audioItem.description ?? "-"}</td>
                <td className="px-2 py-2">{audioItem.dateOverride ?? formatDateForTable(audioItem.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {track.audio.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--muted)]">No audio metadata rows found.</p>
        ) : null}
      </div>
    </section>
  );
}
