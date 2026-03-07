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

      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Metadata</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[#f8efe3] p-3 text-xs text-[color:var(--ink)]">
          {JSON.stringify(track, null, 2)}
        </pre>
      </div>
    </section>
  );
}
