"use client";

import Link from "next/link";
import { useState } from "react";
import { EntityPlaceholderArtwork } from "@/components/entities/entity-placeholder-artwork";
import { AppIcon } from "@/components/ui/app-icons";

interface ProjectArtistLink {
  slug: string;
  name: string;
}

interface ProjectCardData {
  slug: string;
  name: string;
  releaseDateLabel: string;
  typeLabel: string;
  imageHref: string | null;
  artists: ProjectArtistLink[];
  tracks: Array<{
    slug: string;
    name: string;
  }>;
}

interface ArtistGroupData {
  artistSlug: string;
  artistName: string;
  projects: ProjectCardData[];
}

function ExpandableProjectCard({ project }: { project: ProjectCardData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      id={project.slug}
      className="theme-card self-start overflow-hidden"
    >
      <div className="flex min-h-[192px] flex-col gap-4 p-4 sm:grid sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start sm:gap-5">
        <div className="w-full self-start">
          <EntityPlaceholderArtwork
            kind="project"
            variant="list-cover"
            imageHref={project.imageHref}
            alt={`${project.name} artwork`}
          />
        </div>

        <div className="grid min-w-0 self-start gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-[color:var(--ink)]">
                <Link href={`/projects/${project.slug}`} className="underline-offset-4 hover:underline">
                  {project.name}
                </Link>
              </h3>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{project.releaseDateLabel}</p>
            </div>

            <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--icon-color)]">
              {project.typeLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--button-ghost-bg)] px-3 py-2 text-sm text-[color:var(--button-ghost-text)] transition hover:bg-[color:var(--button-ghost-hover)]"
              aria-expanded={expanded}
              aria-controls={`project-details-${project.slug}`}
              onClick={() => setExpanded((current) => !current)}
            >
              <span>{expanded ? "Collapse" : "Expand"}</span>
              <AppIcon name={expanded ? "chevron-down" : "chevron-right"} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div
          id={`project-details-${project.slug}`}
          className="border-t border-[color:var(--border-soft)] bg-[color:var(--bg-panel)] px-4 py-4"
        >
          <div className="grid gap-4">
            <div className="grid gap-1">
              <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted)]">Artists</p>
              <ul className="space-y-1 text-sm text-[color:var(--ink)]">
                {project.artists.map((artist) => (
                  <li key={`${project.slug}-${artist.slug}`}>
                    <Link href={`/artists/${artist.slug}`} className="underline-offset-4 hover:underline">
                      {artist.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-1">
              <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted)]">Tracks</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-[color:var(--ink)] marker:font-semibold">
                {project.tracks.map((track) => (
                  <li key={`${project.slug}-${track.slug}`}>
                    <Link href={`/tracks/${track.slug}`} className="underline-offset-4 hover:underline">
                      {track.name}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ProjectsArtistGroups({ artistGroups }: { artistGroups: ArtistGroupData[] }) {
  return (
    <div className="grid gap-8">
      {artistGroups.map((group) => (
        <section key={group.artistSlug} className="grid gap-3">
          <div className="border-b border-[color:var(--border-soft)] pb-3">
            <h2 className="text-xl font-semibold text-[color:var(--ink)]">{group.artistName}</h2>
            <p className="text-sm text-[color:var(--muted)]">
              {group.projects.length} project{group.projects.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid items-start gap-3 xl:grid-cols-2">
            {group.projects.map((project) => (
              <ExpandableProjectCard key={`${group.artistSlug}-${project.slug}`} project={project} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
