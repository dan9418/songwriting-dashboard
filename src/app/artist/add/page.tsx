"use client";

import Link from "next/link";
import { CreateEntityForm } from "@/components/entities/create-entity-form";
import { api } from "@/lib/client/api";

export default function AddArtistPage() {
  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Artist</h1>
          <p className="text-sm text-[color:var(--muted)]">Create an artist from its name. The slug is generated automatically.</p>
        </div>
        <Link
          href="/artists"
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back To Artists
        </Link>
      </div>

      <CreateEntityForm
        entityLabel="Artist"
        submitLabel="Create Artist"
        successMessage="Artist created."
        createEntity={(name) => api.postArtist(name)}
        getSuccessHref={(slug) => `/artists#${slug}`}
      />
    </section>
  );
}
