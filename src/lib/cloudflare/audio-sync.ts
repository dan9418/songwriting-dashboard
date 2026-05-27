import { queryD1 } from "@/lib/cloudflare/d1";
import { listObjectKeys, objectExists } from "@/lib/cloudflare/r2";

interface AudioObjectRow {
  id: string;
  objectKey: string;
}

export interface TrackAudioReconciliationResult {
  checkedRows: number;
  missingObjects: Array<{
    id: string;
    objectKey: string;
  }>;
  orphanedObjects: string[];
}

export async function reconcileTrackAudioObjects(
  trackSlug: string
): Promise<TrackAudioReconciliationResult> {
  const rows = await queryD1<AudioObjectRow>(
    `
    SELECT
      id,
      object_key AS objectKey
    FROM audio
    WHERE track_slug = ?;
    `,
    [trackSlug]
  );

  const missingObjects: TrackAudioReconciliationResult["missingObjects"] = [];
  const rowKeys = new Set(rows.map((row) => row.objectKey));
  for (const row of rows) {
    if (!(await objectExists(row.objectKey))) {
      missingObjects.push({ id: row.id, objectKey: row.objectKey });
    }
  }

  const r2Keys = await listObjectKeys(`tracks/${trackSlug}/audio/`);
  const orphanedObjects = r2Keys.filter((key) => !rowKeys.has(key));

  return {
    checkedRows: rows.length,
    missingObjects,
    orphanedObjects
  };
}
