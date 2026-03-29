export interface NotebookSamplePage {
  id: string;
  fileName: string;
  rawContent: string;
}

export const NOTEBOOK_SAMPLE_PAGES: NotebookSamplePage[] = [
  {
    id: "random-bits",
    fileName: "random-bits.md",
    rawContent: `---
name: Random Bits
description: Loose lyric scraps and one-liners pulled from the main fragments notebook.
created: 2017-08-29T17:00:00-04:00
last_modified: 2026-03-28T19:10:19-04:00
---

# Quick Hits

- A thousand deployed men forget why they were sent
- Designate this glyph unfit and obscene
- Keep your friends close and your enemies in captivity
- Underwear without pants is just wear

# Lines Worth Revisiting

Sometimes I let the momentum of my impulse carry the weight of my decisions

It rains on that hill both sides of dawn

The internet is where you go for the brutal honesty of anonymous strangers

# Paired Idea

Speak to me my love, won't you please say my name?
Hanging out that window won't do you no good I'm afraid
`
  },
  {
    id: "human-architecture",
    fileName: "human-architecture.md",
    rawContent: `---
name: Human Architecture
description: Longer-form lyric sketches and sectioned song ideas from the Human Architecture draft page.
created: 2012-04-18T20:30:00-04:00
last_modified: 2026-03-28T03:17:04-04:00
---

# History Begins

And so it begins, the search for truth
Questions harbored in the young mind and forgotten after youth
A grain of sand falls from your hands
Life set in motion by the will of your command

# Constellations

Expansive far beyond physical means
But capped on one end by its reflection on the sea
The sky speaks to me, though voiceless and dark
And I see your name written out in the stars

# Gyroscope

Your invitation, the words are so rare
A small reminder that you're there
I will follow you where I once was scared
To stand alone in the cold open air
`
  },
  {
    id: "title-bank",
    fileName: "title-bank.md",
    rawContent: `---
name: Title Bank
description: Candidate song, project, and album titles collected from the archived title fragments page.
created: 2017-08-29T17:00:00-04:00
last_modified: 2026-03-28T03:38:25-04:00
---

# Serious

- Anachronism
- Entertaining The Notions
- Futurecast
- Love Letters Of The 21st Century
- Pulling On The Casket
- The Shoemaker

# Funny

- A Favorite Among The Masochists
- Batteries Not Included
- Escape Goat
- Greasy Delicious
- Hashtag Swag
`
  },
  {
    id: "the-vectors",
    fileName: "the-vectors.md",
    rawContent: `---
name: The Vectors
description: A page of fuller song concepts and structured lyric drafts from the Vectors archive.
created: 2011-06-10T19:45:00-04:00
last_modified: 2026-03-28T04:19:36-04:00
---

# When Your Mind's Made Up

You know you've got me tied up in your chains
My eyes light up at the sound of your name
But it feels like I'm being ignored
And it feels like I've been here before

So when your mind's made up
Can you please let me know?
Because I'm tired of waiting out here all alone.

# Disconnected / Discontented

Disconnected, never enough
Discontented, where is the love?
Where do you go when your youth is used up?
Is there more to life than giving up?
`
  }
];
