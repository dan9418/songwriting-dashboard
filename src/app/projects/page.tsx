import Link from "next/link";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { imageApiHref, listPrimaryProjectImageSlugs } from "@/lib/cloudflare/images";
import { slugToTitle } from "@/lib/utils/slug-display";

export const dynamic = "force-dynamic";

function toTypeLabel(value: "album" | "ep" | "single" | "setlist"): string {
  if (value === "ep") {
    return "EP";
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function parseIsoDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatReleaseDate(value: string | null): string {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "Undated release";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(parsed);
}

function compareProjects(
  left: { releaseDate: string | null; name: string; slug: string },
  right: { releaseDate: string | null; name: string; slug: string }
) {
  const leftDate = parseIsoDate(left.releaseDate);
  const rightDate = parseIsoDate(right.releaseDate);

  if (leftDate && rightDate) {
    const dateCompare = leftDate.getTime() - rightDate.getTime();
    if (dateCompare !== 0) {
      return dateCompare;
    }
  } else if (leftDate) {
    return -1;
  } else if (rightDate) {
    return 1;
  }

  const nameCompare = left.name.localeCompare(right.name);
  if (nameCompare !== 0) {
    return nameCompare;
  }
  return left.slug.localeCompare(right.slug);
}

export default async function ProjectsPage() {
  try {
    const [sourceItems, imageSlugsByProject] = await Promise.all([
      listProjectsFromCloudflare(),
      listPrimaryProjectImageSlugs()
    ]);
    const artistGroups = Array.from(
      sourceItems.reduce<
        Map<
          string,
          {
            artistName: string;
            projects: typeof sourceItems;
          }
        >
      >((map, project) => {
        for (const artist of project.artistSlugs) {
          const existing = map.get(artist.slug);
          if (existing) {
            existing.projects.push(project);
            continue;
          }

          map.set(artist.slug, {
            artistName: artist.name || slugToTitle(artist.slug),
            projects: [project]
          });
        }
        return map;
      }, new Map())
    )
      .map(([artistSlug, group]) => ({
        artistSlug,
        artistName: group.artistName,
        projects: [...group.projects].sort(compareProjects)
      }))
      .sort((left, right) => {
        const nameCompare = left.artistName.localeCompare(right.artistName);
        if (nameCompare !== 0) {
          return nameCompare;
        }
        return left.artistSlug.localeCompare(right.artistSlug);
      });

    return (
      <EntityIndexLayout
        icon="project"
        title="Projects"
        subtitle={`Total: ${sourceItems.length.toLocaleString()}`}
        actionHref="/projects/add"
        actionLabel="Add Project"
      >
        {sourceItems.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No projects found.</p>
        ) : (
          <div className="grid gap-8">
            {artistGroups.map((group) => (
              <section key={group.artistSlug} className="grid gap-3">
                <div className="border-b border-[color:var(--border-soft)] pb-3">
                  <h2 className="text-xl font-semibold text-[color:var(--ink)]">{group.artistName}</h2>
                  <p className="text-sm text-[color:var(--muted)]">
                    {group.projects.length} project{group.projects.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="grid gap-3">
                  {group.projects.map((project) => (
                    <article
                      key={`${group.artistSlug}-${project.slug}`}
                      id={project.slug}
                      className="theme-card flex w-full flex-col gap-4 p-4 md:grid md:grid-cols-[160px_minmax(0,1fr)] md:items-start md:gap-5"
                    >
                      <div className="w-full self-start">
                        <EntityPlaceholderArtwork
                          kind="project"
                          variant="list-cover"
                          imageHref={
                            imageSlugsByProject.get(project.slug)
                              ? imageApiHref(imageSlugsByProject.get(project.slug) ?? "")
                              : null
                          }
                          alt={`${project.name || slugToTitle(project.slug)} artwork`}
                        />
                      </div>

                      <div className="min-w-0 self-start grid gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-xl font-semibold text-[color:var(--ink)]">
                              <Link href={`/projects/${project.slug}`} className="underline-offset-4 hover:underline">
                                {project.name || slugToTitle(project.slug)}
                              </Link>
                            </h3>
                            <p className="mt-1 text-sm text-[color:var(--muted)]">{formatReleaseDate(project.releaseDate)}</p>
                          </div>

                          <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--icon-color)]">
                            {toTypeLabel(project.type)}
                          </span>
                        </div>

                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
                          <div className="grid self-start gap-1">
                            <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted)]">Artists</p>
                            <ul className="space-y-1 text-sm text-[color:var(--ink)]">
                              {project.artistSlugs.map((artist) => (
                                <li key={`${project.slug}-${artist.slug}`}>
                                  <Link href={`/artists/${artist.slug}`} className="underline-offset-4 hover:underline">
                                    {artist.name || slugToTitle(artist.slug)}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="grid self-start gap-1">
                            <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted)]">Tracks</p>
                            <ol className="list-inside list-decimal text-sm leading-7 text-[color:var(--ink)] marker:font-semibold">
                              {project.trackSlugs.map((trackSlug) => (
                                <li
                                  key={`${project.slug}-${trackSlug}`}
                                  className="mr-4 [display:inline_list-item]"
                                >
                                  <Link href={`/tracks/${trackSlug}`} className="underline-offset-4 hover:underline">
                                    {slugToTitle(trackSlug)}
                                  </Link>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </EntityIndexLayout>
    );
  } catch (error) {
    return (
      <EntityIndexLayout
        icon="project"
        title="Projects"
        subtitle={`Failed to load projects from Cloudflare D1.${error instanceof Error ? ` ${error.message}` : ""}`}
        actionHref="/projects/add"
        actionLabel="Add Project"
      />
    );
  }
}
