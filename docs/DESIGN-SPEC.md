# Politika design spec — the front page rules

**Written 23 September 2026, from one day's redesign of the homepage, the bills
pages and the policy comparison.** It exists so the rest of the site can be
redesigned to match without re-deriving the reasoning: hand this file to
whoever (or whatever) does the next page.

`docs/DESIGN-HANDOFF.md` is the older, wider context — why the homepage was cut
down, what the launch phases are. This file is narrower and more literal: the
rules, the numbers, and the mistakes already paid for.

Everything below was applied to `/` (homepage), `/bills`, `/policies/[topic]`.
Nothing below has been applied to: `/parties`, `/parties/[slug]`, `/mps`,
`/mps/[slug]`, `/map`, `/battlegrounds`, `/elections/2026`, `/learn`,
`/budget`, `/news`. Those are the work.

### Extending this document

More than one session works on this site at once, so append rather than
rewrite:

- **A new reusable component** → a numbered sub-section in §2, with its real
  numbers copied from the source, not from memory, and one sentence on what it
  replaced.
- **A measurement that changed** → the table in §3.3.
- **A mechanism bug you fixed** → §5, with the symptom first, so the next
  person recognises it before they understand it.
- **A request that taught something** → §8, verbatim, under the heading it
  belongs to.
- **Something knowingly left undone** → §7.

Do not restate a rule that is already in §1; add the *case* to the section it
belongs in and let §1 stay short. If a rule in §1 turns out to be wrong,
change it and say in the commit message what it used to say.

---

## 1. The principles

These are the reusable part. Numbers change per page; these do not.

**1.1 Nothing is expanded until it is asked for.**
A section opens showing what it is, not its contents. The debated-bills list
used to open with one bill's full detail already showing — a screen and a half
about one bill before the reader had chosen anything, which also made the other
eight read as footnotes to it. Now: tiles closed, tap to open, tap again to
close.

**1.2 Explanation goes behind an (i), not in the body.**
If a block needs a paragraph explaining how to read it, where the data came
from, or what a term means, that paragraph is a bubble. Four separate
explainers came off /bills this way. The test: *would a reader who has been
here before skip this?* If yes, it is an (i).

**1.3 One thing in one place.**
Two controls doing the same job, or one fact stated twice, is the bug. The stat
row and the filter selects both filtered — the stats became inert figures. The
passed-into-law count sat in the description and in the figures — the
description lost it. "Before the House" and "of this Parliament" both meant
"this term" — one of them went.

**1.4 The same interaction produces the same shape.**
Two lists on one page opened into two differently-built panels. Now the
debated-bill panel and the tracker breakdown are the same container, the same
order, the same summary treatment. Extra *data* is allowed; extra *design* is
not. Same for animation: two progress strips became one shared component.

**1.5 Say what is missing.**
A silent gap reads as broken. A bill with no summary says "We haven't written a
plain-language summary for this bill yet." A party with no position says so and
says it is a coverage gap, not a statement that they have no view.

**1.6 Colour carries meaning, and only one meaning at a time.**
A tile is filled with its status colour and outlined in the same hue; the bar
that also carried the status went, because it said it a second time in a third
shade. Topic colour belongs to topics, party colour to parties, and a block
takes the colour of whatever it is *about*.

**1.7 Plain words, not Parliament's.**
"Bills before the House" is Parliament's phrase for "this term" and tells a
first-time reader nothing about whose bills they are. It became "Bills put
forward by {party}", then "Bills introduced by {party}". "Defeated" became
"Not passed". Name the party, name the year, say what happened.

**1.8 Every claim is sourced or it goes.**
Three hand-written headline figures ("300,000+ submissions, a national
record", "90% of submissions opposed", "112–11") were pulled because the bill's
sources were page-level links that evidenced none of them directly. This
matters most where the subject is a single party and every figure cuts one way.
Dated timelines stayed, because each line has a date against it.

---

## 2. The components

Reuse these. Do not build a second one that looks similar.

### 2.1 Info button — `src/components/ui/info-button.tsx`

The (i) and its bubble. Three hand-rolled copies existed before it; two remain
(`policy/topic-info-button.tsx`, `homepage/bills-info-button.tsx`) and should
fold into this one next time either is touched.

| | |
|---|---|
| Button | `size` px circle (26 default, 24 beside a smaller heading), glyph `size * 0.58`, `strokeWidth 2.25` |
| At rest | **no ring, no fill** — the glyph is already a circle; a border drew a second one |
| Open | fills `accent`, white glyph, 1.5px `accent` ring |
| Bubble | `min(340px, 100vw - 36px)`, white, 1px `BORDER`, **3px `accent` top border**, radius 14, padding `16px 36px 4px 18px` |
| Shadow | `0 4px 8px rgba(42,18,6,.06), 0 16px 32px -12px rgba(42,18,6,.22)` |
| Closes on | its ×, the (i) again, Escape. **Not** an outside tap |
| Position | measured after opening and shifted to stay inside the viewport; `align="left"` or `"right"` |

Inside: `InfoHeading` (11.5px, 800, `.08em`, uppercase, accent) then `InfoText`
(14px, INK, 1.55). Two to four short sections.

**Why no outside-tap close:** these run several paragraphs, so reading one means
scrolling, and a scroll whose finger lands anywhere but exactly inside the card
counted as an outside tap and shut it mid-sentence. A thing you have to read is
not a menu.

### 2.2 Pills — `.status-pill` / `.topic-switcher .ap-chip` in `globals.css`

One rule set, shared, so the two rows cannot drift apart:

```
padding: 5px 11px;  gap: 6px;  border-radius: 999px;  border-width: 2px;
label 12.5px 800                      ≤767px: 4px 9px, 11.5px
```

Selected = filled with its own light tint + full-strength border. Unselected =
white fill, same hue at ~34% on the border. Tapping the lit one clears it. An
**All** pill leads the row, carrying the total, lit by default.

Where four pills will not fit one line, squeeze that row only
(`.bills-status-row` takes `6px 7px` / 12.5px), never the shared rule.

### 2.3 Tile — the closed row in any list

```
radius 11 · padding 7px 26px 20px 10px · background = status light tint
border 2px status hue  (3px, darker, when open)
status label   9.5px 800, status colour, top-left
party tag      absolute top: 7 right: 8 — party colours, 9px 800, radius 999
title          12.5px 800 INK, line-height 1.25
chevron        absolute bottom: 7 right: 8, rotates 180° when open
```

Tiles wrap in a grid (`repeat(auto-fill, minmax(min(150px, 100%), 1fr))`, gap
8), they do not scroll sideways. A tile is ~51px closed.

**Tag and chevron are absolutely positioned on purpose.** In the flex row the
tag sat 35px in, because that row also has to clear the chevron's padding, so
it never reached the corner it is meant to occupy.

### 2.4 Expanded panel — the open state of any list

The order is fixed. Copy it exactly for any new list:

```
container   radius 16 · padding clamp(14px, 2.5vw, 20px) · 1px BORDER
            shadow 0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)
1  badge (status, 11px uppercase pill) left · close × right
2  title  clamp(17px, 2.6vw, 21px) 800
3  summary 13.5px, trimmed to two sentences by gist(), with the
   "Read the full breakdown" link INLINE at the end of the sentence
4  label   11px 800 .07em uppercase TERTIARY  ("Its journey through Parliament")
5  journey strip
6  meta    "In charge: {member}" + party chip · "Area:" + TopicChip
7  source  "Official page ↗" / the publisher's name
```

The full-breakdown link is inline because as a standalone signpost it was the
loudest thing in the panel for a link most readers will not take.

**It opens directly beneath the tile that was tapped**, spanning every column
(`gridColumn: 1 / -1`) so the row breaks at that tile — not at the foot of the
grid.

### 2.5 Journey strip — `src/components/bills/bill-journey.tsx`

Beads on a rail that fills, over one eased 1500ms progress, so the rail reaches
a bead exactly as that bead lights. `state: 'done' | 'current' | 'stop'`;
`stop` is the only node that lights red.

```
bead 24px (18px ≤600px) · rail 2px · labels 10.5px (9.5px), max-width 8ch
```

Labels must be short: at six stages the full names wrapped two lines each and
the strip ran deeper than the summary above it. Use `Introduced · 1st ·
Committee · 2nd · 3rd · {outcome}`.

### 2.6 Signpost link — `src/components/ui/sign-link.tsx`

A filled, party-coloured rectangle tapering to a point. **It is for leaving a
section**, one per section at most. Several stacked down a page make each one
count for less — which is why the bills block's way out became a small outlined
chip *inside* its box instead.

---

## 3. Mobile rules

**3.1 The 44px tap-target trap.** `globals.css` gives every `<button>` a 44px
minimum height on phones. That is deliberate and must not be removed. It also
silently inflates any small control. The pattern, used four times now:

```jsx
<button style={{ padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none' }}>
  <span className="…">the visible pill</span>
</button>
```

The button is the hit area; the span is the control. 28px to look at, 44px to
hit. Symptom to watch for: a pill that is exactly 44px tall when you styled it
20-something.

**3.2 Inline styles beat media queries.** A component styled inline cannot be
made responsive from `globals.css`. Ship the CSS *with* the component in a
`<style dangerouslySetInnerHTML>` block, and mount it for every variant — the
bills panel's phone sizing was mounted inside one branch, so the tallest card on
the page never received any of it.

**3.3 Compaction targets that worked.**

| | before | after |
|---|---|---|
| Coverage matrix row | 43px | **31px** |
| Coverage matrix, party column | 154px | **58px**, names wrap, rule down its right edge |
| Coverage matrix, topics visible | 2 of 11 | **6 of 11**, paged with arrows |
| Bill card (featured) | ~800px | fits one screen |
| Bills stat row | ~330px of cards | **73px** of text |
| "Filtered by" pills | 44px | **28px** |

**3.4 Fit-to-width beats shrink-to-fit.** The seats line was scaled to match the
heading's width; because it ends in the party's name its natural width swings
from "ACT" to "Te Pāti Māori", every one of them wider than the label, so the
fit only ever shrank — 16.5px for Green, 13.7px for Te Pāti Māori, resizing
under the reader as they switched. One size (17px) that wraps is better than
six sizes that fit.

**3.5 Paging beats horizontal scroll.** The coverage matrix showed 2 of 11
columns behind a swipe people never found. Now: as many columns as *measured*
width allows, arrows to step, pages balanced (6/5, not 6/5 leftovers), and the
arrows repeat at the second list's band where the header has scrolled away.

**3.6 Folding a long list.** Show five, fade the last row out with a mask that
reaches ~50px *into* it, and sit "Show N more" on the fade. Name the number:
"3 more" is a decision a reader can make, "more" is not. Anything the reader has
opened stays visible even if it sits past the cut.

---

## 4. Copy rules

- **Name the party and the year.** "Bills introduced by Green", "Since the 2023
  election", "Full page on Green's stance on Treaty & Māori Affairs".
- **One line of detail, not three.** "152 now law · 21 waiting to be drawn".
- **No em dashes in user-facing copy.** Comma in prose, colon for a short label
  ("Spokesperson: Finance"), full stop where the dash ended a sentence, en dash
  for numeric ranges. ~710 replaced across 113 files.
  **Warning, paid for once:** that sweep also rewrote three em dashes that were
  *code* — `name.split('—')[0]` became `split('')`, which splits into
  characters, so "Electoral Commission — 2026 timetable" rendered as "E". Never
  run a copy sweep across delimiters, regexes or generated data files.
- **Headings match their peers.** Two sections on one page are the same size
  (24px here); a smaller one reads as a caption on the larger.
- **Say the date on anything that ages.** "as at 24 June 2026", plus a link to
  the live source and a line saying it moves between captures.

---

## 5. Gotchas already paid for

**5.1 `overflow-x: hidden` breaks `position: sticky`.** It makes the element a
scroll container, which becomes the containing block for sticky inside it — the
navbar was sticking to a body that never scrolls, so it scrolled away and the
menu opened off-screen. Use `overflow-x: clip`.

**5.2 The App Router does not `scrollTo(0,0)`.** It calls `scrollIntoView` on
the new page's first element, aligning it with the *viewport* top — under the
4rem sticky navbar. Fixed with `main > :first-child { scroll-margin-top: 4rem }`.
Do **not** use `scroll-padding-top` on the container: in-page anchors carry
their own margins and would be pushed down twice.

**5.3 Scroll anchoring moves the page when a sticky header changes height.**
Turn `overflow-anchor: none` on while a panel inside the header is open.

**5.4 `table-layout: fixed` + `maxWidth: 0`** on every header cell collapsed the
sticky first column to 18px. Give that column an explicit width, and keep the
number in one constant the CSS, the cell and any measuring code all read.

**5.5 Specificity.** `.coverage-matrix th:first-child` and
`.coverage-matrix th.my-class` have the same weight, so source order decides.
Reach for `tr th.my-class` rather than `!important` roulette.

**5.6 Backticks inside a template-literal CSS block** end the literal. Use
quotes in those comments.

---

## 6. Applying this to the next page

A checklist, in the order that worked:

1. **Cut.** What is on this page because it was on the old one? The homepage
   lost the compass card, the Find-your-MP block, the install pill, the
   credibility strip, three standfirsts and two section groups in the nav.
2. **Fold the explanation.** Every paragraph that explains rather than informs
   goes behind an (i) beside the heading it belongs to.
3. **Find the duplicated control.** Two things filtering, two things linking to
   the same place, one number stated twice.
4. **Close everything.** Nothing expanded on arrival. Tiles, then a panel on tap.
5. **Match the shapes.** If the page has a list that opens, it opens into §2.4.
   If it has a status, it uses §2.2. If it has stages, §2.5.
6. **Measure on a 375px phone.** Row heights, one-line fits, tap targets. Every
   number in §3.3 came from measuring, not from taste.
7. **Check the claims.** Anything stated as a figure needs a source you can put
   under it, or it does not ship.

## 7. Open, and deliberately not done

- `topic-info-button.tsx` and `bills-info-button.tsx` still hold their own
  copies of the (i) pattern; fold them into `ui/info-button.tsx`.
- ~200 of the 285 tracked bills have no summary. The machinery exists
  (`scripts/enrich-bills.mjs` — Claude grounded only in the official bill text,
  then an editor approves); it has not been run across the backlog.
- The ballot list is dated 24 June 2026 and is **hand-transcribed** into
  `scripts/build-members-bills.mjs`. Refreshing it means re-transcribing.
- The Treaty Principles figures come back only with a citation each: the Justice
  Committee report for the submissions count and the share opposed, Hansard for
  the vote.

---

## 8. The requests, in the words they were made

Kept verbatim, typos and all, because the phrasing is the brief. Grouped by
what they teach, not by when they arrived. Read this section before designing
anything: it is the difference between following the rules above and
understanding what they are for.

### Cut things

> "Remove the logo on home."
> "remove the find mp"
> "remove this" *(the compass card)*
> "remove how it progressed why it matters where it came from"
> "196 have passed into law. Remove this from the description"
> "I want you to remove each of the descriptions underneath. The menu and just
> the menu titles don't have any lines in between."
> "take bills tracker out of the record remove the record and budget and have
> them as stand alones" / "remove all from your electorate too and make seperate"

The instinct is consistently **fewer things, flatter**. When a group exists to
name a grouping rather than a destination, dissolve it. When a line explains
something visible directly below it, delete the line.

### Put explanation behind an (i)

> "These on the bills tracker page should be behind an 'i' button, following the
> same as I defined for other information buttons."
> "remove this and put in an i icon"
> "A curated selection of the term's most-debated bills… move intto and i icon
> informationa"
> "Merge the other eye button into this as well and move it next to the title.
> inline"

Note "**following the same as I defined**" — the (i) is treated as an existing
system element, not a new decision each time. Two (i)s on one page is one too
many; merge them.

### Make it smaller, on a phone

> "this all needs compacting in the same way you did for the policy comparison
> table for mobile"
> "way to big these filter pills"
> "I want these stats to be more compact and not clickable, and more for
> information."
> "even less gap between the first and second columns. I want you to compact
> that part even more, even if you have to fade off the name a little bit"
> "Make these small, like the same sizes as the ones at the top of the policy
> comparison."
> "this i logo is not formatted to proper size way to big check size"
> "it is too long options??"

**"the same sizes as"** and **"the same as you did for"** recur. The
expectation is that a size is a shared decision, not a per-component one — which
is why §2.2 is one CSS rule and not two.

### Make two things match exactly

> "I love the way this is animated so cahgne the all bills terms tiles to match
> exact same"
> "all of this should follow exact as containers in all bills term lets make the
> change" → "I mean the content inside should match same as
> content/composition exactly as this" → "including summaries etc"

Three messages to land one idea, and the third is the precise one:
**composition**, not just the frame. When asked to match, match the order and
the content treatment, not the border radius.

### Progressive disclosure

> "lets only see top 5 and gradient hide the rest and then have an arrow to tap
> scroll more"
> "have a drop down arrow on each container"
> "add a filters button that hides filters"
> "instead I want pills for in progress now law and defeated that can be tapped
> like on policy comparison page and then these tiles with bill titles show
> beneath and only once tapped do we see expand"

### Plainer words

> "All bills this term I want this to be more plain for people who understand it
> is this current term. Let's make it more plain."
> "i need to have tit more plaine so is it [party] submitted to the house?"
> "Too much text. Let's simplify."
> "instead of defined this term i want this to be Highlights or Popular what are
> Some suggestions"

That last one is the model for how to answer a copy question: options with
trade-offs, and a reason to avoid the one that would mislead (**"Popular"** was
rejected because it implies approval, and the list includes a bill that drew a
record number of *opposing* submissions).

### Interaction, not decoration

> "home page seats i should be able to tap seats as well and it swwitches to
> that party" → "the area around the dots not just the dots itself"
> "For any information container that's tapped, I need you to ensure that it
> doesn't close when I'm in the container and I tap the container or try
> scrolling while tapping on the container."
> "Currently, when I tap a new issue from the menu… it reloads the page, but it
> jumps. I need it to load exactly the same position for every device."

Every one of these is a real-device complaint, and each turned out to be a
mechanism bug rather than a styling one (see §5). **Take "it jumps" literally
and go measure.**

### Questions that changed the work

> "is there more bills they entered to the ballot? dont you think these are
> improtant to access??"
> "where do these stats come from? why is no other hae them??"
> "some of these have no summarys???"
> "What does 'in progress' mean? Does that mean it's already passed but now
> about to be applied?"

These are the most valuable messages in the whole day. Each exposed something
the design was hiding: 72 ballot bills that existed in the data and were shown
nowhere; three unsourced figures on the one bill whose subject is a single
party; ~200 bills with no summary and no acknowledgement of it; and a status
label that could be read as the opposite of what it means.

**When the reader asks "where did this come from?", the answer is a design
problem, not a support question.**
