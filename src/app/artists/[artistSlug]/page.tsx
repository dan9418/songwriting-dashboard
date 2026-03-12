import Link from "next/link";
import { notFound } from "next/navigation";
import { listArtistsFromCloudflare } from "@/lib/cloudflare/catalog";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

export default async function ArtistBySlugPage({
  params
}: {
  params: Promise<{ artistSlug: string }>;
}) {
  const { artistSlug } = await params;
  const artists = await listArtistsFromCloudflare();
  const artist = artists.find((item) => item.slug === artistSlug);

  if (!artist) {
    notFound();
  }

  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">{artist.name || slugToTitle(artist.slug)}</h1>
          <p className="text-sm text-[color:var(--muted)]">{artist.slug}</p>
        </div>
        <Link
          href="/artists"
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back To Artists
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          {artist.projectSlugs.length === 0 ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">No projects linked.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {artist.projectSlugs.map((project) => (
                <li key={project.slug}>
                  <Link href={`/projects/${project.slug}`} className="underline-offset-4 hover:underline">
                    {project.name || slugToTitle(project.slug)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Tracks</h2>
          {artist.trackSlugs.length === 0 ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">No tracks linked.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {artist.trackSlugs.map((trackSlug) => (
                <li key={trackSlug}>
                  <Link href={`/tracks/${trackSlug}`} className="underline-offset-4 hover:underline">
                    {slugToTitle(trackSlug)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
