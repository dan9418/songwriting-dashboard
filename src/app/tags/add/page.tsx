import { AddTagForm } from "@/app/tags/add/add-tag-form";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

export const dynamic = "force-dynamic";

export default async function AddTagPage() {
  const tracks = await listTracksFromCloudflare();

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Tag</h1>
          <p className="text-sm text-[color:var(--muted)]">Create a tag and optionally link tracks immediately.</p>
        </div>
      </div>

      <AddTagForm
        trackOptions={tracks.map((track) => ({
          slug: track.slug,
          name: track.name
        }))}
      />
    </section>
  );
}
