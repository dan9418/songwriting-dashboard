import Link from "next/link";
import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { ProjectsArtistGroups } from "@/app/projects/projects-artist-groups";
import { listProjectsFromCloudflare } from "@/lib/cloudflare/catalog";
import { imageApiHref, listPrimaryProjectImageSlugs } from "@/lib/cloudflare/images";
import { getRequestOrigin } from "@/lib/request-origin";
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
    const [sourceItems, imageSlugsByProject, requestOrigin] = await Promise.all([
      listProjectsFromCloudflare(),
      listPrimaryProjectImageSlugs(),
      getRequestOrigin()
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
        projects: [...group.projects].sort(compareProjects).map((project) => ({
          slug: project.slug,
          name: project.name || slugToTitle(project.slug),
          releaseDateLabel: formatReleaseDate(project.releaseDate),
          typeLabel: toTypeLabel(project.type),
          imageHref: imageSlugsByProject.get(project.slug)
            ? imageApiHref(imageSlugsByProject.get(project.slug) ?? "", requestOrigin)
            : null,
          artists: project.artistSlugs.map((artist) => ({
            slug: artist.slug,
            name: artist.name || slugToTitle(artist.slug)
          })),
          tracks: project.trackSlugs.map((trackSlug) => ({
            slug: trackSlug,
            name: slugToTitle(trackSlug)
          }))
        }))
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
          <ProjectsArtistGroups artistGroups={artistGroups} />
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
