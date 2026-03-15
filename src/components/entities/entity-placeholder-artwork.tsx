import { AppIcon } from "@/components/ui/app-icons";

type ArtworkVariant = "card-avatar" | "card-cover" | "detail-avatar" | "detail-cover";
export type ArtworkKind = "artist" | "project";

export function EntityPlaceholderArtwork({
  kind,
  variant
}: {
  kind: ArtworkKind;
  variant: ArtworkVariant;
}) {
  if (variant === "card-cover") {
    return (
      <div className="mb-4 flex aspect-square w-full max-w-[180px] items-center justify-center rounded-xl border border-[#ddcfbd] bg-[#f6eee2] text-[color:var(--muted)]">
        <AppIcon name={kind} className="h-14 w-14" />
      </div>
    );
  }

  if (variant === "detail-cover") {
    return (
      <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border border-[#ddcfbd] bg-[#f6eee2] text-[color:var(--muted)] md:max-w-[240px]">
        <AppIcon name={kind} className="h-16 w-16 md:h-20 md:w-20" />
      </div>
    );
  }

  if (variant === "detail-avatar") {
    return (
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-[#ddcfbd] bg-[#f6eee2] text-[color:var(--muted)] md:h-32 md:w-32">
        <AppIcon name={kind} className="h-12 w-12 md:h-14 md:w-14" />
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ddcfbd] bg-[#f6eee2] text-[color:var(--muted)]">
        <AppIcon name={kind} className="h-8 w-8" />
      </div>
    </div>
  );
}
