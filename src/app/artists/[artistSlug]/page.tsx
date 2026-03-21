import { notFound } from "next/navigation";
import { ArtistDetailControls } from "@/app/artists/[artistSlug]/artist-detail-controls";
import { listArtistsFromCloudflare, listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { queryD1 } from "@/lib/cloudflare/d1";
import { getPrimaryArtistImageSlug, imageApiHref } from "@/lib/cloudflare/images";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { getRequestOrigin } from "@/lib/request-origin";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

interface ArtistDetailRow {
  description: string;
}

interface ArtistExternalLinkRow {
  platform: string;
  url: string;
}

export default async function ArtistBySlugPage({
  params
}: {
  params: Promise<{ artistSlug: string }>;
}) {
  const { artistSlug } = await params;
  const [artists, projects, tracks, detailRows, externalLinkRows, imageSlug, requestOrigin] =
    await Promise.all([
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
    ),
    queryD1<ArtistExternalLinkRow>(
      `
      SELECT
        external_links.platform AS platform,
        external_links.url AS url
      FROM artist_external_links
      JOIN external_links
        ON external_links.id = artist_external_links.external_link_id
      WHERE artist_external_links.artist_slug = ?
      ORDER BY external_links.platform ASC, external_links.url ASC;
      `,
      [artistSlug]
    ),
    getPrimaryArtistImageSlug(artistSlug),
    getRequestOrigin()
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
        initialExternalLinks={externalLinkRows}
        imageHref={imageSlug ? imageApiHref(imageSlug, requestOrigin) : null}
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
