import Link from "next/link";
import { AppIcon, type AppIconName } from "@/components/ui/app-icons";

const ENTITIES = [
  {
    title: "Artists",
    icon: "artist",
    brief: "",
    description: "Keep artist names, notes, and linked songs in one place.",
    addHref: "/artists/add",
    listHref: "/artists",
    addLabel: "Add New",
    listLabel: "See All"
  },
  {
    title: "Projects",
    icon: "project",
    brief: "",
    description: "Organize releases, sets, and singles without losing the details.",
    addHref: "/projects/add",
    listHref: "/projects",
    addLabel: "Add New",
    listLabel: "See All"
  },
  {
    title: "Tracks",
    icon: "track",
    brief: "",
    description: "Track each song's details, files, and where it belongs.",
    addHref: "/tracks/add",
    listHref: "/tracks",
    addLabel: "Add New",
    listLabel: "See All"
  }
] satisfies Array<{
  title: string;
  icon: AppIconName;
  brief: string;
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
          Dan Bednarczyk's
        </p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Songwriting Dashboard</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
          A creativity workspace and discography catalog
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
                <p className="text-sm text-[color:var(--muted)]">{entity.brief}</p>
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
