import { AddArtistForm } from "@/app/artists/add/add-artist-form";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

export const dynamic = "force-dynamic";

export default async function AddArtistPage() {
  const [projects, tracks] = await Promise.all([listProjectsFromCloudflare(), listTracksFromCloudflare()]);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Artist</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Create an artist and set its editable metadata and relationships up front.
          </p>
        </div>
      </div>

      <AddArtistForm
        projectOptions={projects.map((project) => ({
          slug: project.slug,
          name: project.name
        }))}
        trackOptions={tracks.map((track) => ({
          slug: track.slug,
          name: track.name
        }))}
      />
    </section>
  );
}
