import { notFound } from "next/navigation";
import { getTrackMetadataFromCloudflare } from "@/lib/cloudflare/tracks";
import { listTagsFromCloudflare } from "@/lib/cloudflare/tags";
import { TrackMarkdownDocCard } from "@/components/tracks/track-markdown-doc-card";
import { TrackDetailControls } from "@/app/tracks/[trackSlug]/track-detail-controls";
import { TrackAudioTable } from "@/components/tracks/track-audio-table";
import { listArtistsFromCloudflare, listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { getTrackDisplayImageSlug, imageApiHref } from "@/lib/cloudflare/images";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function TrackByIdPage({
  params
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  const [track, artists, projects, tags, imageSlug, requestOrigin] = await Promise.all([
    getTrackMetadataFromCloudflare(trackSlug),
    listArtistsFromCloudflare(),
    listProjectsFromCloudflare(),
    listTagsFromCloudflare(),
    getTrackDisplayImageSlug(trackSlug),
    getRequestOrigin()
  ]);

  if (!track) {
    notFound();
  }

  return (
    <section className="grid gap-4">
      <TrackDetailControls
        trackSlug={track.slug}
        initialName={track.name}
        initialArtistSlugs={track.artistSlugs}
        initialProjectSlugs={track.projectSlugs}
        initialTagSlugs={track.tagSlugs}
        initialAudio={track.audio}
        imageHref={imageSlug ? imageApiHref(imageSlug, requestOrigin) : null}
        artistOptions={artists.map((artist) => ({
          slug: artist.slug,
          name: artist.name
        }))}
        projectOptions={projects.map((project) => ({
          slug: project.slug,
          name: project.name
        }))}
        tagOptions={tags.map((tag) => ({
          slug: tag.slug,
          name: tag.name
        }))}
      />

      <div className="grid gap-4">
        <TrackMarkdownDocCard trackSlug={track.slug} type="notes" />
      </div>

      <div className="panel overflow-x-auto p-4">
        <TrackAudioTable trackSlug={track.slug} audio={track.audio} />
      </div>
    </section>
  );
}
