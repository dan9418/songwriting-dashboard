import Link from "next/link";
import { AddProjectForm } from "@/app/projects/add/add-project-form";
import { listArtistsFromCloudflare } from "@/lib/cloudflare/catalog";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

export const dynamic = "force-dynamic";

export default async function AddProjectPage() {
  const [artists, tracks] = await Promise.all([listArtistsFromCloudflare(), listTracksFromCloudflare()]);

  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Project</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Create a project with full metadata, linked artists, and ordered tracks.
          </p>
        </div>
        <Link href="/projects" className="theme-button-link theme-button-link--ghost">
          Back To Projects
        </Link>
      </div>

      <AddProjectForm
        artistOptions={artists.map((artist) => ({
          slug: artist.slug,
          name: artist.name
        }))}
        trackOptions={tracks.map((track) => ({
          slug: track.slug,
          name: track.name
        }))}
      />
    </section>
  );
}
