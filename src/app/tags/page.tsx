import Link from "next/link";
import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { listTagsFromCloudflare } from "@/lib/cloudflare/tags";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  try {
    const tags = await listTagsFromCloudflare();

    return (
      <EntityIndexLayout icon="tag" title="Tags" subtitle={`Total: ${tags.length.toLocaleString()}`}>
        {tags.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No tags found.</p>
        ) : (
          <ul className="grid gap-3">
            {tags.map((tag) => (
              <li key={tag.slug} className="theme-card grid gap-2 p-4">
                <div>
                  <Link href={`/tags/${tag.slug}`} className="text-lg font-semibold underline-offset-4 hover:underline">
                    {tag.name}
                  </Link>
                  <p className="text-sm text-[color:var(--muted)]">{tag.slug}</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-[color:var(--muted)]">Tracks: </span>
                  {tag.trackSlugs.length > 0 ? (
                    tag.trackSlugs.map((track, index) => (
                      <span key={track.slug}>
                        {index > 0 ? ", " : null}
                        <Link href={`/tracks/${track.slug}`} className="underline-offset-4 hover:underline">
                          {track.name}
                        </Link>
                      </span>
                    ))
                  ) : (
                    <span className="text-[color:var(--muted)]">No tracks linked.</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </EntityIndexLayout>
    );
  } catch (error) {
    return (
      <EntityIndexLayout
        icon="tag"
        title="Tags"
        subtitle={`Failed to load tags from Cloudflare D1.${error instanceof Error ? ` ${error.message}` : ""}`}
      />
    );
  }
}
