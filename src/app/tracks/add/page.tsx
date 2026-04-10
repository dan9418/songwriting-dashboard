import { AddTrackForm } from "@/app/tracks/add/add-track-form";
import { listArtistsFromCloudflare, listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";

export const dynamic = "force-dynamic";

export default async function AddTrackPage() {
  const [artists, projects] = await Promise.all([listArtistsFromCloudflare(), listProjectsFromCloudflare()]);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Track</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Create a track and set its artist and project links immediately.
          </p>
        </div>
      </div>

      <AddTrackForm
        artistOptions={artists.map((artist) => ({
          slug: artist.slug,
          name: artist.name
        }))}
        projectOptions={projects.map((project) => ({
          slug: project.slug,
          name: project.name
        }))}
      />
    </section>
  );
}
