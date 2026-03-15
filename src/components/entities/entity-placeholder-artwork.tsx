import { AppIcon } from "@/components/ui/app-icons";

type ArtworkVariant = "card-avatar" | "card-cover" | "list-cover" | "detail-avatar" | "detail-cover";
export type ArtworkKind = "artist" | "project";

export function EntityPlaceholderArtwork({
  kind,
  variant
}: {
  kind: ArtworkKind;
  variant: ArtworkVariant;
}) {
  const iconName = kind === "project" ? "note" : kind;

  if (variant === "card-cover") {
    return (
      <div className="mb-4 flex aspect-square w-full max-w-[180px] items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)]">
        <AppIcon name={iconName} className="h-14 w-14" />
      </div>
    );
  }

  if (variant === "detail-cover") {
    return (
      <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)] md:max-w-[240px]">
        <AppIcon name={iconName} className="h-16 w-16 md:h-20 md:w-20" />
      </div>
    );
  }

  if (variant === "list-cover") {
    return (
      <div className="flex aspect-square w-full max-w-[160px] items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)]">
        <AppIcon name={iconName} className="h-14 w-14" />
      </div>
    );
  }

  if (variant === "detail-avatar") {
    return (
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)] md:h-32 md:w-32">
        <AppIcon name={iconName} className="h-12 w-12 md:h-14 md:w-14" />
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)]">
        <AppIcon name={iconName} className="h-8 w-8" />
      </div>
    </div>
  );
}
