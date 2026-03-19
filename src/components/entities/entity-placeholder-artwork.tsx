"use client";

import Image from "next/image";
import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icons";

type ArtworkVariant =
  | "card-avatar"
  | "card-cover"
  | "list-cover"
  | "detail-avatar"
  | "detail-cover"
  | "table-thumb";
export type ArtworkKind = "artist" | "project" | "track";

export function EntityPlaceholderArtwork({
  kind,
  variant,
  imageHref,
  alt
}: {
  kind: ArtworkKind;
  variant: ArtworkVariant;
  imageHref?: string | null;
  alt?: string;
}) {
  const iconName = kind === "project" || kind === "track" ? "note" : kind;
  const [imageFailed, setImageFailed] = useState(false);

  function renderImage() {
    if (!imageHref || imageFailed) {
      return null;
    }

    return (
      <Image
        src={imageHref}
        alt={alt ?? ""}
        fill
        sizes="(max-width: 768px) 40vw, 240px"
        className="object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  if (variant === "card-cover") {
    const image = renderImage();
    if (image) {
      return (
        <div className="relative mb-4 aspect-square w-full max-w-[180px] overflow-hidden rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)]">
          {image}
        </div>
      );
    }
    return (
      <div className="mb-4 flex aspect-square w-full max-w-[180px] items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)]">
        <AppIcon name={iconName} className="h-14 w-14" />
      </div>
    );
  }

  if (variant === "detail-cover") {
    const image = renderImage();
    if (image) {
      return (
        <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] md:max-w-[240px]">
          {image}
        </div>
      );
    }
    return (
      <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)] md:max-w-[240px]">
        <AppIcon name={iconName} className="h-16 w-16 md:h-20 md:w-20" />
      </div>
    );
  }

  if (variant === "list-cover") {
    const image = renderImage();
    if (image) {
      return (
        <div className="relative aspect-square w-full max-w-[160px] overflow-hidden rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)]">
          {image}
        </div>
      );
    }
    return (
      <div className="flex aspect-square w-full max-w-[160px] items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)]">
        <AppIcon name={iconName} className="h-14 w-14" />
      </div>
    );
  }

  if (variant === "detail-avatar") {
    const image = renderImage();
    if (image) {
      return (
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] md:h-32 md:w-32">
          {image}
        </div>
      );
    }
    return (
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)] md:h-32 md:w-32">
        <AppIcon name={iconName} className="h-12 w-12 md:h-14 md:w-14" />
      </div>
    );
  }

  if (variant === "card-avatar") {
    const image = renderImage();
    if (image) {
      return (
        <div className="relative mb-4 h-16 w-16 overflow-hidden rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)]">
          {image}
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

  if (variant === "table-thumb") {
    const image = renderImage();
    if (image) {
      return (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)]">
          {image}
        </div>
      );
    }

    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[color:var(--icon-color)]">
        <AppIcon name={iconName} className="h-6 w-6" />
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
