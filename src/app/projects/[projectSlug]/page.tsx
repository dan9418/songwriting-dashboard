import { notFound } from "next/navigation";
import { ProjectDetailControls } from "@/app/projects/[projectSlug]/project-detail-controls";
import {
  listArtistsFromCloudflare,
  listProjectsFromCloudflare
} from "@/lib/cloudflare/catalog";
import { queryD1 } from "@/lib/cloudflare/d1";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";
import { slugToTitle } from "@/lib/utils/slug-display";
export const dynamic = "force-dynamic";

interface ProjectDetailRow {
  description: string;
  releaseDate: string | null;
  remasterDate: string | null;
}

export default async function ProjectBySlugPage({
  params
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  const [projects, artists, tracks, detailRows] = await Promise.all([
    listProjectsFromCloudflare(),
    listArtistsFromCloudflare(),
    listTracksFromCloudflare(),
    queryD1<ProjectDetailRow>(
      `
      SELECT
        description,
        release_date AS releaseDate,
        remaster_date AS remasterDate
      FROM projects
      WHERE slug = ?
      LIMIT 1;
      `,
      [projectSlug]
    )
  ]);
  const project = projects.find((item) => item.slug === projectSlug);

  if (!project) {
    notFound();
  }
  const details = detailRows[0];

  return (
    <section className="grid gap-4">
      <ProjectDetailControls
        projectSlug={project.slug}
        initialName={project.name}
        initialDescription={details?.description ?? ""}
        initialType={project.type}
        initialReleaseDate={details?.releaseDate ?? null}
        initialRemasterDate={details?.remasterDate ?? null}
        initialArtistSlugs={project.artistSlugs.map((artist) => artist.slug)}
        initialTrackSlugs={project.trackSlugs}
        artistOptions={artists.map((artist) => ({
          slug: artist.slug,
          name: artist.name || slugToTitle(artist.slug)
        }))}
        trackOptions={tracks.map((track) => ({
          slug: track.slug,
          name: track.name
        }))}
      />
    </section>
  );
}
