import { notFound } from "next/navigation";
import { TagDetailControls } from "@/app/tags/[tagSlug]/tag-detail-controls";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { getTagMetadataFromCloudflare } from "@/lib/cloudflare/tags";

export const dynamic = "force-dynamic";

export default async function TagBySlugPage({
  params
}: {
  params: Promise<{ tagSlug: string }>;
}) {
  const { tagSlug } = await params;
  const [tag, tracks] = await Promise.all([getTagMetadataFromCloudflare(tagSlug), listTracksFromCloudflare()]);

  if (!tag) {
    notFound();
  }

  return (
    <section className="grid gap-4">
      <TagDetailControls
        tagSlug={tag.slug}
        initialName={tag.name}
        initialTrackSlugs={tag.trackSlugs.map((track) => track.slug)}
        trackOptions={tracks.map((track) => ({
          slug: track.slug,
          name: track.name
        }))}
      />
    </section>
  );
}
