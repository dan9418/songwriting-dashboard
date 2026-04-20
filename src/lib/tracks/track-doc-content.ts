const DOC_TYPES = ["lyrics", "chords", "notes"] as const;

type TrackDocSectionType = (typeof DOC_TYPES)[number];

const SECTION_LABELS: Record<TrackDocSectionType, string> = {
  lyrics: "Lyrics",
  chords: "Chords",
  notes: "Notes"
};

export interface TrackDocSectionMap {
  lyrics: string | null;
  chords: string | null;
  notes: string | null;
}

function buildTrackDocSection(label: string, body: string): string {
  return `# ${label}\n\n${body}`;
}

export function buildCombinedTrackDocContent(contentsByType: TrackDocSectionMap): string {
  return DOC_TYPES.filter((type) => contentsByType[type] !== null)
    .map((type) => buildTrackDocSection(SECTION_LABELS[type], contentsByType[type] ?? ""))
    .join("\n\n");
}

export function extractCombinedTrackDocSections(content: string): TrackDocSectionMap | null {
  const headingRegex = /^# (Lyrics|Chords|Notes)(?:\r?\n|$)/gm;
  const matches = Array.from(content.matchAll(headingRegex));

  if (matches.length === 0 || matches[0].index !== 0) {
    return null;
  }

  const sections: TrackDocSectionMap = {
    lyrics: null,
    chords: null,
    notes: null
  };
  let lastOrder = -1;

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const type = current[1].toLowerCase() as TrackDocSectionType;
    const order = DOC_TYPES.indexOf(type);
    if (order < 0 || order <= lastOrder) {
      return null;
    }
    lastOrder = order;

    let bodyStart = (current.index ?? 0) + current[0].length;
    if (content.slice(bodyStart, bodyStart + 1) === "\n") {
      bodyStart += 1;
    }

    const nextMatch = matches[index + 1];
    const nextIndex = nextMatch?.index ?? content.length;
    const bodyEnd = nextMatch ? Math.max(bodyStart, nextIndex - 2) : content.length;
    sections[type] = content.slice(bodyStart, bodyEnd);
  }

  return buildCombinedTrackDocContent(sections) === content ? sections : null;
}
