import { AudioIndexTable } from "@/app/audio/audio-index-table";
import { EntityIndexLayout } from "@/components/entities/entity-index-layout";
import { listAudioIndexItemsFromD1 } from "@/lib/cloudflare/track-audio-files";

export const dynamic = "force-dynamic";

export default async function AudioPage() {
  try {
    const items = await listAudioIndexItemsFromD1();

    return (
      <EntityIndexLayout
        icon="note"
        title="Audio"
        subtitle={`Total: ${items.length.toLocaleString()}`}
        actionHref="/audio/add"
        actionLabel="Add Audio"
      >
        <AudioIndexTable items={items} />
      </EntityIndexLayout>
    );
  } catch (error) {
    return (
      <EntityIndexLayout
        icon="note"
        title="Audio"
        subtitle={`Failed to load audio from Cloudflare D1.${error instanceof Error ? ` ${error.message}` : ""}`}
        actionHref="/audio/add"
        actionLabel="Add Audio"
      />
    );
  }
}
