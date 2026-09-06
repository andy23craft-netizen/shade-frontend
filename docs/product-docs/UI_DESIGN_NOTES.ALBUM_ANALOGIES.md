# Album UI Analogies — From Reading Room to Record Store Crate Digging

**Status:** Ideation reference. These analogies are intentionally broader than current V2 scope. They describe a
coherent album-side visual language without committing every idea to implementation.

**Source:** `UI_DESIGN_NOTES.MD`

## Core translation

Shade is one library with multiple rooms. The book UI is the **Reading Room**, evoking Nabokov's office, card catalogs,
loan cards, paper, dark wood, brass, glass, cloth binding, and ink stamps. The album UI is the **Listening Room**, an
adjoining room shaped by the experience of crate digging in a warm, curated independent record shop.

The two areas should clearly belong to one product and one physical imagination, but they should not be identical skins.
The Listening Room translates each library object into an object from record retail, home hi-fi listening, collecting,
or archival music culture. It should feel cozy but more colorful than the Reading Room, with confident handwritten
accents and carefully restrained visual energy.

| Library language | Album-side analogue |
| --- | --- |
| Private library / writer's office | Warm, curated independent record store |
| Card catalog | Record-bin dividers and handwritten shop index cards |
| Catalog drawer | LP storage bin, flight case, or amplifier cabinet |
| Library card | Record-shop price sticker, want-list card, or staff recommendation slip |
| Ink date stamp | Rubber-stamped arrival date, condition mark, or pressing note |
| Book spine | LP spine in a tightly packed bin |
| Book cover | Album sleeve displayed face-out |
| Reading desk | Listening counter with turntable, headphones, and sleeve-rest |
| Brass drawer pull | Knurled brass stereo knob, toggle switch, or case latch |
| Library signage | Hand-painted shop sign, bold window lettering, or marker-written placard |
| Quiet stacks | Dense record bins, face-out displays, and a cozy listening corner |
| Librarian | Record-store clerk, collector, selector, or shop curator |
| Author quote | Musician, composer, producer, or liner-notes quote |
| Staff Picks | Staff Picks / Now Spinning wall |
| Loan card | Checkout sleeve, listening log, or stamped shop ledger |
| Footnote | Liner note, matrix/runout annotation, or session personnel note |
| Dust motes in window light | Sun across a record bin, warm lamp glow, or subtle vinyl dust |

The target is not a photorealistic record store pasted behind the application. As on the book side, the interface should
**behave** like its reference place: flipping through bins, scanning handwritten dividers, pulling a sleeve forward,
reading the back cover and liner notes, making a want-list discovery, and seeing what the clerk recommends. Crate digging
is the primary interaction metaphor, not merely one decorative option among several.

## Illustration and art direction

The original notes leave the exact illustrative style open. Album-side treatments can use the same chosen rendering
family as the library while changing the subject matter. For example:

- A mid-century library illustration becomes a neighborhood record-shop illustration with strong geometry, colorful
  sleeve blocks, and restrained silhouettes.
- Cozy anime library light becomes a sunlit or lamplit record store with packed bins, plants, handwritten signs, and a
  record waiting at a small listening station.
- Graphic-novel stacks become high-contrast sleeve art, bold shop posters, inked hands flipping through records, and
  blocks of saturated retail color.
- Flat-vector card catalogs become modular record bins, speaker grilles, equalizer bars, and abstract sleeve shapes.
- Cutout paper becomes layered shop posters, pasted price labels, handwritten divider cards, and collage-like album art.
- Stylized 3D furniture becomes walnut speaker cabinets, a turntable plinth, chrome controls, and rows of jacket spines.

Psychedelic references can appear selectively for genre or collection accents, but should not become the default visual
language. The base room should remain calm enough for browsing metadata.

## Color palettes

The house jewel tones, gold accents, plants, and dark wood can carry across both rooms. The Listening Room shifts their
balance toward colorful sleeve art, painted bins, glossy vinyl, bright shop signs, and sun-warmed surfaces. It should be
noticeably brighter and bolder than the Reading Room without becoming loud or visually indiscriminate.

| Existing palette idea | Listening Room use |
| --- | --- |
| Slate Storm | Speaker cloth, equipment panels, shadow beneath bins |
| Mahogany Roast / Rosewood | Record bins, speaker cabinets, listening counter |
| Golden Honey / Antique Bronze | Dial markings, case hardware, warm lamps, selected states |
| Teal Canopy / Deep Forest | Painted dividers, walls, plant accents, cool sleeve colors |
| Ember Brick / Oxide Red | Sale stickers, shop signage, featured dividers, urgent states |
| Ruby Leaf | Record-label accents, featured releases, handwritten recommendation cards |
| Indigo Rain / Sapphire Blue | Painted fixtures, sleeve accents, focused listening mode |
| Olive Moss | Plants, vintage equipment paint, quieter secondary panels |
| Pearl White | Sleeve inserts, track sheets, receipts, high-contrast reading surfaces |

The 60/30/10 rule still applies, but the Listening Room should not inherit the Reading Room's darkness. A useful default
would be warm ivory or a clear muted color as the environmental base, wood and deep indigo for structure, and coral,
honey, teal, or ruby for controlled high-energy accents. Brighter colors can appear in sleeve-sized blocks and bin
dividers rather than washing every surface. Pure black should be reserved for vinyl, Sharpie-like lettering,
typography, or deep contrast rather than swallowing the interface.

## Typography

The book side's typewriter and stamp faces translate into a small family of music-retail typography:

- Typewriter text becomes typed liner notes, session sheets, inventory cards, and used-record grading notes.
- Stampwriter text becomes arrival stamps, price marks, catalog numbers, and shop inventory stamps.
- Institutional library headings become condensed record-shop signage or bold hand-lettered display type.
- Small-cap metadata becomes record-label typography for label, catalog number, format, speed, and release year.
- A Sharpie-like handwritten face can be reserved for clerk recommendations, crate-divider labels, price notes, or
  “Ask me about this one” cards. It should feel quick and human, with enough weight and spacing to stay legible.

Display typography may echo independent-shop signs and hand-marked dividers, but metadata and controls must remain
highly readable. The handwritten voice is an accent, not the default body or control face. Avoid turning every heading
into a novelty poster. Font loading and fallbacks should follow the same practical constraints as the main UI.

## Materials and component metaphors

| Book-side material/object | Album-side interpretation |
| --- | --- |
| Aged ivory paper | Liner-note paper, shop receipt, track sheet, or sleeve insert |
| Dark stained wood | Record bin, listening counter, speaker cabinet, turntable plinth |
| Brass | Knurled knobs, toggle hardware, case corners, small lamps |
| Library-card cardstock | Bin divider, price card, “recommended” card, or shop flyer |
| Glass | Dust cover over a turntable, record-shop window, framed gold record |
| Cloth/book binding | Speaker grille cloth, acoustic panel, or fabric-lined bin |
| Ink/rubber stamps | Arrival date, condition grade, “used,” “promo,” or “staff pick” |
| File separator tab | Genre/artist alphabet divider protruding above a record bin |
| Brass pull handle | Amp knob or recessed road-case handle |
| Checkout stamp button | Turntable start/stop control, illuminated console button, or shop stamp |

Panels can resemble sleeves pulled partly from jackets, track-list inserts, shop index cards, or equipment faceplates.
The metaphors should clarify hierarchy rather than obscure familiar controls.

### Hover, focus, and motion states

- A record card rises slightly as if a sleeve has been pulled forward from a bin.
- A jacket edge or inner sleeve becomes visible on hover or focus.
- A brass knob catches light, but does not rotate unless rotation communicates a real value.
- A price sticker or “Now Spinning” tab gains contrast when selected.
- Search may use a blinking console lamp or typed inventory cursor, retaining an ordinary text caret.
- A cover may tilt by a degree or two like a hand flipping through records; reduced-motion mode removes the movement.
- A playing-state disc may rotate slowly only when it represents actual audio playback—not as constant decoration.
- Keyboard focus should be at least as explicit as hover, potentially using a lit control-ring or bright sleeve outline.

## Layout and annotation ideas

The book UI's footnotes become **liner notes** on the album side. Secondary explanations can be numbered like session
notes, annotated with an asterisk like a pressing detail, or revealed as the reverse side of a track sheet. Easter eggs
can reference catalog numbers, matrix markings, recording dates, studios, personnel, and small bits of music history.

The album interface can preserve the sense of furniture by using a record-bin edge along one side, rows of divider tabs,
a walnut listening counter across a page boundary, or amplifier-like panels for controls. It should still acknowledge
that it is software: responsive search, predictable navigation, accessible dialogs, and fast filtering take priority
over literal simulation.

## Landing page

**Library original:** An old library with stacks, card catalogs, ladder, dust, clock, window, and a “Welcome to Shade
Library” sign.

**Album analogue:** The entrance to the Listening Room: a warm, curated independent record shop with colorful sleeves,
handwritten signs, deep bins, and a small hi-fi corner visible beyond the counter.

Possible elements:

- Face-out sleeves in the front window and dense album spines farther inside.
- A hand-painted or softly illuminated “Shade Records — est. 2026” sign.
- A chalkboard or marker board listing “Now Spinning,” “New in the Bins,” and staff recommendations.
- A listening counter with turntable, headphones, small lamp, and a record waiting beside the platter.
- Warm daylight and pools of imperfect lamp light instead of uniform illumination.
- A wall clock, eventually showing actual time.
- A rain-streaked or sunlit front window, eventually reflecting weather or season.
- Floating vinyl dust caught in window or task-lamp light in place of library dust motes.
- A clear route back to the shared Home; the user returns there before entering the Reading Room.

Clicking the sign enters the album Home. Time-of-day lighting, live weather, and a fully navigable room remain future
possibilities even though the analogy is useful now.

## Home page

**Library original:** A conversational home full of card-catalog-like discovery modules.

**Album analogue:** The shop's feature wall and central row of bins—the place where someone sees what is playing, what
just came in, what the staff loves, and which unexpected sleeve rewards another pass through the crate. Mobile modules
can still occupy roughly one screen each, but should resemble adjacent bins and displays rather than an undifferentiated
feed.

Cards can look like sleeves in shallow display rails, compact shop recommendation cards, or liner-note panels. Selecting
one opens the album, artist, or collection detail page.

### Musician quotes

Author quotes become quotes from musicians, composers, arrangers, producers, engineers, critics, or liner notes. A quote
can appear on a hand-lettered wall card, a printed insert, or a typed note taped beside the listening station. Selecting
it opens the artist's albums or an appropriate curated view.

### Staff Picks

The direct analogue is especially strong: a **Staff Picks** bin or wall. Picks can be separated by curator using small
handwritten cards, colored divider tabs, or shop-staff portraits/initials. Rotating picks might carry “In heavy rotation”
or “Ask us about this one” notes without losing the stable Staff Picks heading.

### New Additions

The new-acquisitions carousel becomes **New Arrivals**, shown as a row of face-out sleeves or records newly filed into a
bin. Acquisition date can resemble a small price-gun label or arrival stamp. The layout should accommodate unusually
long album titles without imitating the square cover's typography.

### Prominent Collections

Featured book collections become changing bins or endcaps such as “Spiritual Jazz,” “Tulsa Sound,” “Blue Note,” “Live
Albums,” “Sunday Morning,” or “Liz's Favorites.” Genre dividers, listening-mood cards, or small shop-poster headers can
give each collection an identity without making mixed-media collections.

### Random album

“Random Book” becomes **Drop the Needle**, **Pick from the Bin**, or a stable functional heading such as **Surprise Me**
with the expressive phrase above it. It can randomize by artist, genre, label, format, decade, mood, location, played or
unplayed state, or any other supported filter. The interaction might visually pull one sleeve forward; a literal animated
hand or turntable sequence is optional future atmosphere.

### Current listening

The album counterpart to Current Reading is **Now Spinning**, **On the Turntable**, or **Recently Played**, depending on
the actual data available. A record resting partly outside its sleeve is a useful motif, but should not imply playback
unless the system really tracks it.

## Dashboard

**Library original:** An owner-focused desk of collection totals, circulation state, reading history, capacity, and
category charts.

**Album analogue:** The record-store back counter, inventory clipboard, or compact hi-fi console. It is still primarily
for the owner and can be a little showy.

Possible translations:

- Albums owned → stock count on an inventory card or mechanical counter.
- Albums loaned → sleeves missing from their bin, summarized on a checkout sheet.
- Formats → a clean chart for vinyl, cassette, and CD, with visual cues from spindle adapters, tape windows, and discs.
- Genres → record-label-inspired donut or bar charts, keeping conventional labels and values readable.
- Played/unplayed → “In rotation” versus “Still sealed/unplayed,” only if those states exist in the data.
- Missing items → a conspicuous empty sleeve or red inventory flag.
- Capacity → bin-fill indicators rather than bookshelf length.
- Wishlist count → “Want list” card at the shop counter.
- Acquisitions by year → stacked arrival cards, price labels, or a conventional timeline.
- Gifts → a small “From friends” crate or acquisition-source breakdown.
- Listening by year → a play log, calendar heatmap, or conventional trend chart with subtle equalizer styling.
- Weather quote → a track, lyric-free music note, or album recommendation suited to the imagined room's atmosphere;
  actual weather integration remains a later concern.

Meters, waveform shapes, and equalizer bars can decorate real values, but fake audio meters should not animate merely to
make the dashboard feel musical.

## Collection / album catalog

**Library original:** Browsing prized shelves and book spines through searchable catalog cards.

**Album analogue:** Flipping through the owner's record bins. This is the clearest expression of the crate-digging
metaphor: dense enough to invite discovery, organized enough to find a known record quickly, and tactile without slowing
the search. The collection should make it immediately obvious whether a particular artist, title, release, label, or
format is present.

The introductory “How to use this catalog” card becomes a bright **How to browse these bins** divider. It can look like
a marker-lettered shop card or an alphabet separator and still offer Skip.

Filters and search sit to the left on wide screens, styled like a vertical stack of bin dividers or a record-store index.
Potential filters include artist, album title, genre, subgenre, label, format, year, country, pressing/release, speed,
location, condition, rating, played/unplayed, and availability—only where supported metadata exists.

View analogies:

- **List:** A shop inventory card or liner-note strip: small sleeve left, album/artist prominent, pressing and location
  below.
- **Grid:** A face-out display wall, similar to browsing album art in a media server but grounded with sleeve shadows,
  price tabs, colorful divider accents, and condition/status marks.
- **Bin:** A denser optional view showing jacket spines and alphabet/genre separators. This can remain conceptual until
  it offers better usability than list or grid.

Search can support artist, title, label, catalog number, barcode, and genre. Exact release identity should remain clear;
the atmosphere must not blur the difference between a musical work, a release, and an owned physical copy.

## Album details

**Book original:** A dusty catalog record with cover, title/author/description, and a stamped loan card.

**Album analogue:** A record pulled from the bin and placed on the listening counter, with its sleeve face-up and the
liner notes, track list, pressing details, and ownership history arranged around it.

Possible composition:

```text
┌──────────────────────────────────────────────────┐
│                                                  │
│   [ ALBUM SLEEVE ]    ALBUM TITLE                │
│                       ARTIST                     │
│                       label · year · format      │
│                       ─────────────────────      │
│                       release / pressing notes   │
│                                                  │
├──────────────────────────┬───────────────────────┤
│ TRACK LIST               │ SESSION / PERSONNEL   │
│ A1 ...                   │ musicians             │
│ A2 ...                   │ producer / engineer   │
├──────────────────────────┴───────────────────────┤
│ OWNERSHIP / LOAN / LISTENING HISTORY             │
└──────────────────────────────────────────────────┘
```

The sleeve may sit beside a partially visible inner sleeve, a record label, or the next jacket in the crate. Metadata can
borrow from liner notes and record-center labels: artist, title, label, catalog number, release year, format, country,
pressing, condition, genres, styles, track list, personnel, producer, engineer, and location. Empty fields should
disappear rather than leaving a wall of blank studio credits.

Loan history can resemble a stamped shop checkout sleeve, a lending ledger, or a listening-station log. Borrower
signatures translate naturally to a handwritten checkout slip or signed shop ledger while remaining unmistakably a loan
record.

A selected contextual quote could come from liner notes or an artist interview, but rights, sourcing, and manual curation
must be resolved before it becomes data-driven. External metadata import is analogous to the book lookup question and
should remain backend-owned.

## Wishlist / want list

**Library original:** Multiple filterable wishlists with edition-specific or title-only entries and seller links.

**Album analogue:** A collector's **Want List**, the familiar record-store and record-fair list of releases being hunted.

Cards can look like small shop index cards, photocopied sleeves, saved price tags, or handwritten fair lists. Release-
specific wants show exact format, pressing, label, catalog number, and barcode. Work-level wants can use a more generic
placeholder sleeve and language such as “any playable pressing” or “preferred edition not specified.”

Filters might answer “Which jazz records does Andy want?”, “Which labels am I collecting?”, “Which gaps remain in this
artist's discography?”, or “Which wants are available locally?” Seller links can point to a chosen independent shop,
label, artist store, marketplace, or special edition rather than assuming one distributor.

When a wanted album is acquired, “Where did you get this?” becomes especially natural and can capture shop, record fair,
gift, label, artist store, or online seller.

## Digital library record / shop ledger

**Library original:** An automatic journal of acquisitions, loans, returns, and other events.

**Album analogue:** A **Shop Ledger**, **Listening-Room Log**, or **Session Book** that records the life of the album
collection.

Example entries:

- “Six records arrived September 1, 2026 — estate-sale finds.”
- “A first pressing moved from New Arrivals to the Jazz bin.”
- “Two albums loaned after Friday's listening session.”
- “Cassette returned and rated.”
- “New Staff Pick placed in the front display.”

Visually, it could resemble a bound shop ledger, a studio session log, a stack of dated receipts, or a wall inventory
calendar.
Over time it can support “On this day,” collection history, acquisition stories, and changing displays, even if those
features are outside V2.

## Reading history / listening history

**Library original:** A chronological memory of books read, eventually including other reading formats.

**Album analogue:** **Listening History** or **Records Played**, initially a straightforward sequence of albums and
eventually a memory of listening sessions.

It might resemble a shop play log, notebook beside a turntable, or date-stamped stack of sleeves. Later entries could
include who listened, where, format, rating, notes, or the occasion. Digital listening
services might someday contribute plays, but importing streams should not erase the distinction between listening to
music and owning a physical album.

## Circulation

**Library original:** A minimal scan-first desk that determines whether a book is coming or going.

**Album analogue:** A minimal lending station at the record-store counter, with a checkout sleeve, shop stamp, and the
album pulled from its usual bin.

The page can use a deep indigo, oxblood, or forest background with one illuminated equipment-like panel in the center.
Scan the album's Shade QR code or supported commercial identifier; the system determines whether it is being loaned or
returned. A knurled-control or illuminated-button visual can reinforce the interaction without making the user operate a
fake stereo.

- Checkout asks for the borrower and any required acknowledgement.
- Check-in asks for the borrower's rating and optional review.
- The confirmation can resemble a stamped receipt, claim ticket, or checkout sleeve.
- An eventual borrower email can resemble a tasteful shop receipt or hold confirmation and include the lending policy.
- Overdue reminders can feel like courteous record-store follow-up, not a punitive library fine notice.

The interaction remains deliberately sparse. The shop atmosphere comes from color, materials, typography, and tactile
inventory details, not from hiding the scan and confirmation steps inside a literal simulation.

## Shared identity and boundaries

Shade's shared Home is the doorway to both rooms. A user enters either the Reading Room or the Listening Room from Home
and returns to Home before moving between them. The rooms should share accessibility standards, interaction timing,
responsive behavior, and a recognizable Shade brand while their navigation and presentation make the current room
unmistakable:

- The Reading Room is paper, catalog furniture, book cloth, stamps, and daylight through dust.
- The Listening Room is colorful sleeves, walnut record bins, speaker cloth, knobs, Sharpie-lettered dividers, shop
  cards, warm daylight, and cozy pools of task light.
- Brass, jewel tones, plants, imperfect light, restrained depth, and personal curation connect the rooms.
- Brighter controlled colors, denser face-out artwork, and handwritten retail marks make the Listening Room feel more
  energetic without sacrificing calm, hierarchy, or legibility.

Not every analogy needs to become a component, and many are explicitly useful only as future design vocabulary. The
best implementation choices will be the ones that make ordinary catalog actions feel native to crate digging in the
Listening Room while remaining fast, legible, accessible, and unmistakably digital.
