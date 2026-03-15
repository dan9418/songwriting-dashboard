import Link from "next/link";
import { AppIcon } from "@/components/ui/app-icons";

export default function HomePage() {
  return (
    <section className="grid gap-4">
      <div className="panel overflow-hidden p-8">
        <p className="text-xs uppercase tracking-[0.15em] text-[color:var(--muted)]">Dan Bednarczyk&apos;s</p>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Songwriting Dashboard</h1>
        <p className="mt-3 max-w-2xl text-base text-[color:var(--muted)]">
          The app is organized around artists, projects, and tracks, with relationships stored in D1 join tables and
          track media stored in R2.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="theme-icon-frame h-10 w-10">
              <AppIcon name="artist" className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold">Artists</h2>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Manage artist metadata and connected projects/tracks.
          </p>
          <div className="mt-4">
            <Link href="/artists/add" className="theme-button-link theme-button-link--primary">
              <AppIcon name="plus" className="h-4 w-4" />
              Add Artist
            </Link>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="theme-icon-frame h-10 w-10">
              <AppIcon name="project" className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold">Projects</h2>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            View project type, artist memberships, and ordered tracklists.
          </p>
          <div className="mt-4">
            <Link href="/projects/add" className="theme-button-link theme-button-link--primary">
              <AppIcon name="plus" className="h-4 w-4" />
              Add Project
            </Link>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="theme-icon-frame h-10 w-10">
              <AppIcon name="track" className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold">Tracks</h2>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Inspect track relationships, markdown docs, and synced audio metadata.
          </p>
          <div className="mt-4">
            <Link href="/tracks/add" className="theme-button-link theme-button-link--primary">
              <AppIcon name="plus" className="h-4 w-4" />
              Add Track
            </Link>
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex items-center gap-2">
          <span className="theme-icon-frame h-10 w-10">
            <AppIcon name="home" className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Relationship Model</h2>
        </div>
        <p className="mt-2 text-sm text-[color:var(--muted)]">Artists {"<->"} Projects via `project_artists`.</p>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Projects {"<->"} Tracks via `project_tracks` (with `position`).
        </p>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Artists {"<->"} Tracks via `track_artists`.</p>
      </div>
    </section>
  );
}
