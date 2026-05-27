import { AddAudioForm } from "@/app/audio/add/add-audio-form";
import { listTracksFromCloudflare } from "@/lib/cloudflare/tracks";

export const dynamic = "force-dynamic";

export default async function AddAudioPage() {
  const tracks = await listTracksFromCloudflare();

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Audio</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Upload an audio file and link it to an existing track.
          </p>
        </div>
      </div>

      <AddAudioForm
        trackOptions={tracks.map((track) => ({
          slug: track.slug,
          name: track.name
        }))}
      />
    </section>
  );
}
