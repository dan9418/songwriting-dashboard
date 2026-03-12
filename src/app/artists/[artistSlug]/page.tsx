import { notFound } from "next/navigation";
import { ArtistDetailControls } from "@/app/artists/[artistSlug]/artist-detail-controls";
import { listArtistsFromCloudflare, listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { queryD1 } from "@/lib/cloudflare/d1";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

interface ArtistDetailRow {
  description: string;
}

export default async function ArtistBySlugPage({
  params
}: {
  params: Promise<{ artistSlug: string }>;
}) {
  const { artistSlug } = await params;
  const [artists, projects, tracks, detailRows] = await Promise.all([
    listArtistsFromCloudflare(),
    listProjectsFromCloudflare(),
    listTracksFromCloudflare(),
    queryD1<ArtistDetailRow>(
      `
      SELECT description
      FROM artists
      WHERE slug = ?
      LIMIT 1;
      `,
      [artistSlug]
    )
  ]);
  const artist = artists.find((item) => item.slug === artistSlug);

  if (!artist) {
    notFound();
  }
  const details = detailRows[0];

  return (
    <section className="grid gap-4">
      <ArtistDetailControls
        artistSlug={artist.slug}
        initialName={artist.name || slugToTitle(artist.slug)}
        initialDescription={details?.description ?? ""}
        initialProjectSlugs={artist.projectSlugs.map((project) => project.slug)}
        initialTrackSlugs={artist.trackSlugs}
        projectOptions={projects.map((project) => ({
          slug: project.slug,
          name: project.name || slugToTitle(project.slug),
          artistSlugs: project.artistSlugs.map((linkedArtist) => linkedArtist.slug)
        }))}
        trackOptions={tracks.map((track) => ({
          slug: track.slug,
          name: track.name || slugToTitle(track.slug),
          artistSlugs: track.artistSlugs
        }))}
      />
    </section>
  );
}
