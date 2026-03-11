"use client";

import Link from "next/link";
import { CreateEntityForm } from "@/components/entities/create-entity-form";
import { api } from "@/lib/client/api";

export default function AddProjectPage() {
  return (
    <section className="grid gap-4">
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Project</h1>
          <p className="text-sm text-[color:var(--muted)]">Create a project from its name. The slug is generated automatically.</p>
        </div>
        <Link
          href="/projects"
          className="rounded-lg bg-[#f4eadb] px-3 py-2 text-sm text-[color:var(--ink)] transition hover:bg-[#eadcc8]"
        >
          Back To Projects
        </Link>
      </div>

      <CreateEntityForm
        entityLabel="Project"
        submitLabel="Create Project"
        successMessage="Project created."
        helperText='Projects created here default to type "single" until a fuller edit flow exists.'
        createEntity={(name) => api.postProject(name)}
        getSuccessHref={(slug) => `/projects#${slug}`}
      />
    </section>
  );
}
