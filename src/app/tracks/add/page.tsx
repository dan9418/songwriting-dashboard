"use client";

import Link from "next/link";
import { CreateEntityForm } from "@/components/entities/create-entity-form";
import { api } from "@/lib/client/api";

export default function AddTrackPage() {
  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Track</h1>
          <p className="text-sm text-[color:var(--muted)]">Create a track from its name. The slug is generated automatically.</p>
        </div>
        <Link href="/tracks" className="theme-button-link theme-button-link--ghost">
          Back To Tracks
        </Link>
      </div>

      <CreateEntityForm
        entityLabel="Track"
        submitLabel="Create Track"
        successMessage="Track created."
        createEntity={(name) => api.createTrack(name)}
        getSuccessHref={(slug) => `/tracks/${slug}`}
      />
    </section>
  );
}
