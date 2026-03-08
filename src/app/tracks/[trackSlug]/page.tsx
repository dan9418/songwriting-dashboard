import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";

export const dynamic = "force-dynamic";

const USER_SLUG = "dan";

function formatTrackNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export default async function TrackByIdPage({
  params
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  const track = await getTrackMetadataFromCloudflare(USER_SLUG, trackSlug);

  if (!track) {
    notFound();
  }

  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">{formatTrackNameFromSlug(track.slug)}</h1>
          <p className="text-sm text-[color:var(--muted)]">{track.slug}</p>
        </div>
        <Link
          href="/tracks"
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back To Tracks
        </Link>
      </div>

      <div className="panel overflow-x-auto p-4">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddcfbd] text-xs uppercase tracking-wide text-[color:var(--muted)]">
              <th className="px-2 py-2 font-semibold">Name</th>
              <th className="px-2 py-2 font-semibold">Lyrics</th>
              <th className="px-2 py-2 font-semibold">Chords</th>
              <th className="px-2 py-2 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#efe3d3]">
              <td className="px-2 py-3 font-medium text-[color:var(--ink)]">{formatTrackNameFromSlug(track.slug)}</td>
              <td className="px-2 py-3">&nbsp;</td>
              <td className="px-2 py-3">&nbsp;</td>
              <td className="px-2 py-3">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panel overflow-x-auto p-4">
        <h2 className="text-lg font-semibold">Audio</h2>
        <table className="mt-3 min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddcfbd] text-xs uppercase tracking-wide text-[color:var(--muted)]">
              <th className="px-2 py-2 font-semibold">Slug</th>
              <th className="px-2 py-2 font-semibold">Type</th>
              <th className="px-2 py-2 font-semibold">Type Version</th>
              <th className="px-2 py-2 font-semibold">Description</th>
              <th className="px-2 py-2 font-semibold">Date Descriptor</th>
              <th className="px-2 py-2 font-semibold">Date Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {track.audio.map((audioItem) => (
              <tr key={audioItem.slug} className="border-b border-[#efe3d3]">
                <td className="px-2 py-2">{audioItem.slug}</td>
                <td className="px-2 py-2">{audioItem.type}</td>
                <td className="px-2 py-2">{audioItem.typeVersion}</td>
                <td className="px-2 py-2">{audioItem.description ?? "-"}</td>
                <td className="px-2 py-2">{audioItem.dateDescriptor}</td>
                <td className="px-2 py-2">{audioItem.dateUploaded ?? "-"}</td>
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
