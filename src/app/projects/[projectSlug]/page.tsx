import Link from "next/link";
import { notFound } from "next/navigation";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

function toTypeLabel(value: "album" | "ep" | "single" | "setlist"): string {
  if (value === "ep") {
    return "EP";
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export default async function ProjectBySlugPage({
  params
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  const projects = await listProjectsFromCloudflare();
  const project = projects.find((item) => item.slug === projectSlug);

  if (!project) {
    notFound();
  }

  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name || slugToTitle(project.slug)}</h1>
          <p className="text-sm text-[color:var(--muted)]">
            {project.slug} {String.fromCharCode(8226)} {toTypeLabel(project.type)}
          </p>
        </div>
        <Link
          href="/projects"
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back To Projects
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Artists</h2>
          {project.artistSlugs.length === 0 ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">No artists linked.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {project.artistSlugs.map((artist) => (
                <li key={artist.slug}>
                  <Link href={`/artists/${artist.slug}`} className="underline-offset-4 hover:underline">
                    {artist.name || slugToTitle(artist.slug)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Tracks</h2>
          {project.trackSlugs.length === 0 ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">No tracks linked.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {project.trackSlugs.map((trackSlug) => (
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
