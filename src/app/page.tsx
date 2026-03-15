import Link from "next/link";
import { AppIcon, type AppIconName } from "@/components/ui/app-icons";

const ENTITIES = [
  {
    title: "Artists",
    icon: "artist",
    description: "Manage artist names, descriptions, and the projects and tracks connected to each artist.",
    addHref: "/artists/add",
    listHref: "/artists",
    addLabel: "Add New",
    listLabel: "See All"
  },
  {
    title: "Projects",
    icon: "project",
    description: "Organize releases, sets, and singles with the right metadata, artist links, and track order.",
    addHref: "/projects/add",
    listHref: "/projects",
    addLabel: "Add New",
    listLabel: "See All"
  },
  {
    title: "Tracks",
    icon: "track",
    description: "Keep track details, connected artists and projects, plus any related docs and audio versions.",
    addHref: "/tracks/add",
    listHref: "/tracks",
    addLabel: "Add New",
    listLabel: "See All"
  }
] satisfies Array<{
  title: string;
  icon: AppIconName;
  description: string;
  addHref: string;
  listHref: string;
  addLabel: string;
  listLabel: string;
}>;

export default function HomePage() {
  return (
    <section className="grid gap-4">
      <div className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Songwriting Dashboard
        </p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Manage your core catalog entities.</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
          Start with the area you need: artists, projects, or tracks. Each section gives you quick access to the most
          common actions.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {ENTITIES.map((entity) => (
          <article key={entity.title} className="panel grid gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="theme-icon-frame h-12 w-12 shrink-0">
                <AppIcon name={entity.icon} className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">{entity.title}</h2>
                <p className="text-sm text-[color:var(--muted)]">Core entity</p>
              </div>
            </div>

            <p className="text-sm leading-6 text-[color:var(--muted)]">{entity.description}</p>

            <div className="flex flex-wrap gap-2">
              <Link href={entity.addHref} className="theme-button-link theme-button-link--primary">
                <AppIcon name="plus" className="h-4 w-4" />
                {entity.addLabel}
              </Link>
              <Link href={entity.listHref} className="theme-button-link theme-button-link--ghost">
                {entity.listLabel}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
