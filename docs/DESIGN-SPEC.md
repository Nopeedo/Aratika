# Politika design spec — the front page rules

**Written 23 September 2026, from one day's redesign of the homepage, the bills
pages and the policy comparison.** It exists so the rest of the site can be
redesigned to match without re-deriving the reasoning: hand this file to
whoever (or whatever) does the next page.

`docs/DESIGN-HANDOFF.md` is the older, wider context — why the homepage was cut
down, what the launch phases are. This file is narrower and more literal: the
rules, the numbers, and the mistakes already paid for.

Everything below was applied to `/` (homepage), `/bills`, `/policies/[topic]`,
the directory half of `/parties` (§2.14), and, on 23 September,
`/elections/2026` and `/learn` (both tiers). Nothing below has been applied to:
`/parties/[slug]`, `/mps`, `/mps/[slug]`, `/map`, `/battlegrounds`, `/budget`,
`/news`. Those are the work.

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

**Why no ring at rest:** the first version carried a 1.5px ring in the accent
colour all the time, on the reasoning that a control should look like a control.
On screen it read as two concentric circles, the glyph's own and the border's,
and at 26px there is not enough room between them for that to look deliberate.
The fill on open carries the state instead, which is the only moment the state
matters.

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

The first attempt at that row shrank everything: the shared phone rule
(`4px 9px` / 11.5px) still wrapped All, In progress, Now law and Not passed onto
two lines at 375px, so the labels went down again from there. That fitted and
was not readable. What actually bought the line was taking the HORIZONTAL
padding out, 11px to 7px, and putting the type back UP to 12.5px with
`white-space: nowrap`. The lesson generalises: when four things will not fit,
take the space between them before you take the size of them.

### 2.3 Tile — the closed row in any list

```
radius 11 · padding 7px 26px 20px 10px · background = status light tint
border 2px status hue  (3px, darker, when open)
status label   9.5px 800, status colour, top-left
party tag      absolute top: 7 right: 8 — party colours, 9px 800, radius 999
title          12.5px 800 INK, line-height 1.25
chevron        absolute bottom: 7 right: 8, rotates 180° when open
```

Tiles wrap in a grid (`repeat(auto-FIT, minmax(min(150px, 100%), 1fr))`, gap
8), they do not scroll sideways. A tile is ~51px closed. See §5.18 for why it
is auto-fit and not auto-fill; every grid in this document was written
auto-fill and every one of them was wrong at a desktop width.

**Tag and chevron are absolutely positioned on purpose.** In the flex row the
tag sat 35px in, because that row also has to clear the chevron's padding, so
it never reached the corner it is meant to occupy.

That took four commits, and the order is the reasoning. The party tag went on
the debated list first, because that list is one party's bills often as not.
Then on the tracker, because a reader moving between the two lists found the
same tile answering "whose bill is this?" in one of them and not the other, and
§1.4 says the same interaction produces the same shape. Then the chevron moved
to the bottom-right corner, which was the move that actually freed the top-right
for the tag. Only then could the tag be pinned there. Pinning it first would
have put it under the chevron.

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

**Matching the frame is not matching.** The first pass copied the container, the
radius, the shadow and the order of the rows, and it was still wrong: the two
panels showed different THINGS in those rows. One carried a full summary, the
other two sentences; one linked out from a signpost, the other inline. The
second pass moved the content treatment across, `gist()` and all, and that is
the one that landed. If the instruction is "make these match", copy the
composition and not the box.

### 2.5 Journey strip — `src/components/bills/bill-journey.tsx`

Beads on a rail that fills, over one eased 1500ms progress, so the rail reaches
a bead exactly as that bead lights. `state: 'done' | 'current' | 'stop'`;
`stop` is the only node that lights red.

```
bead 24px (18px ≤600px) · rail 2px · labels 10.5px (9.5px), max-width 8ch
```

Labels must be short: at six stages the full names wrapped two lines each and
the strip ran deeper than the summary above it. Use `Introduced · 1st ·
Committee · 2nd · 3rd · {outcome}`. The tracker's array is literally
`['Introduced', '1st', 'Committee', '2nd', '3rd']` plus the outcome, and the
first version of it read "First reading", "Select committee", "Second reading",
"Third reading", which is what wrapped.

**There were two of these before there was one.** The debated list and the
tracker each had their own strip, and they animated differently: same idea, two
easings, two ways of deciding when a bead was lit. Neither was wrong on its own
page and the difference only showed when a reader met both, which is the
argument in §1.4. The shared component fills off one 1500ms eased progress and
derives the lit state from it (`p >= i / (n - 1)`), so the rail and the beads
cannot drift apart, because they are the same number.

### 2.6 Signpost link — `src/components/ui/sign-link.tsx`

A filled, party-coloured rectangle tapering to a point. **It is for leaving a
section**, one per section at most. Several stacked down a page make each one
count for less — which is why the bills block's way out became a small outlined
chip *inside* its box instead.

### 2.7 Chamber arch — `src/components/elections/seat-chamber.tsx` (`home`)

The 2023 chamber as a band that follows the seating, used on the homepage
above the selected party's seat count. It replaced a plain rounded rectangle
around the semicircle, which left a wedge of empty box in each top corner and
read as a chart in a card rather than as the room.

The band is derived from the seat positions, never hand drawn, so it keeps an
equal margin at every point as the chart scales:

```
GAP 16 (clearance from the outermost and innermost dots) · CORNER 10 · STROKE 4
R  = max(distance from centre) + dotR + GAP        outer edge
Ri = max(CORNER * 2, min(distance) - dotR - GAP)   inner edge
bottom = cy + dotR + GAP                           the flat foot
```

The `home` variant also drops the tabs, the eyebrow and the chamber total
(`marginTop: 28` instead), because the number under the arch is the selected
party's, not the House's.

**Seat dots get a rim.** `rimColor()` returns the same hue darkened (factor
0.55 when luminance > 0.6, else 0.7) and returns nothing below 0.18 luminance.
Without it ACT's yellow vanished into the page; with a rim on NZ First's near
black it would have been invisible anyway, and a lighter one reads as a halo.
Unselected parties sit at `opacity 0.38`. 0.18 was the first value and the
faded parties stopped reading as seats at all.

Tapping the space around a dot picks that party, not just the dot itself.

### 2.8 Caucus box — `src/components/homepage/party-electorates.tsx`

The selected party's MPs, split by how they got in. It replaced a single line
of statistics ("2 electorate, 9 list"), which stated the mechanism and named
nobody.

```
container  2px party border · party light fill · radius 14 · padding 12px 10px
           grid 1fr 1fr, gap 10
heading    11.5px 800 .04em uppercase black, height 2.5em, line-clamp 2,
           1.5px rule in {party}55, padding-bottom 6, margin-bottom 7
row        44px fixed · gap 5 · radius 9 · 1px #00000014 on white
           xs avatar · name 12px 800 · sub 10.5px SECONDARY, both ellipsised
rails      ROWS_H = 4 * 44 + 3 * 5 = 191px, FIXED
chevrons   24px, bare, no chrome, disabled colour #00000026
```

Four reasons the numbers are what they are:

- **The height is fixed, not capped.** A party with six MPs made a shorter box
  than one with forty, and the tile cycle turns every few seconds, so the page
  moved under the reader while they were using it.
- **Exactly four rows, not four and a sliver.** A list of four then ends flush
  with the bottom edge, gets no fade and no arrows, and there is nothing below
  to point at. A fifth row is what makes them appear. The first attempt assumed
  a 39px card against an actual 44, so a four MP list overflowed by 20px and
  showed a fade for a row that was not there.
- **The headings are a fixed two lines.** "3 won a local seat" takes one line
  and "12 came off the party list" takes two, so a minimum height left one
  column's rule 7px above the other's.
- **Fade at the bottom only.** A fade under the heading read as the column
  being cut off rather than scrolled.

Headings are counts in plain words, "2 won a local seat" and "9 came off the
party list", not "electorate" and "list", which mean nothing to a reader who
has not been taught MMP. Electorate MPs are ordered by 2023 winning margin,
widest first, and the margin itself is not shown: "+23,376" beside a name read
as a score.

### 2.9 Preview over the page — `src/components/homepage/mp-preview.tsx`

Tapping a row opens the MP over the page instead of leaving it. Navigating to
the profile was a page change to answer "who is that?", and then a trip back to
the party being read about.

```
scrim   rgba(12,14,18,.6) + 3px blur · panel min(420px, 100%) · max-height 86vh
panel   radius 16 · 2px party border · header on the party's light fill
bio     trimmed at 320 chars
facts   label 96px column, 12px 800 uppercase TERTIARY · value 13.5px 800
foot    party-filled "{First}'s full profile", then parliament.nz as a quiet link
```

Escape, the ×, or the scrim closes it, and the body scroll is locked while it
is open. It renders only the fields the record actually holds: most MPs are a
name, a party, a role and an electorate, and nothing is invented to fill the
panel out.

### 2.10 Grouped signposts — `src/components/homepage/explore-carousel.tsx`

The way to every other page. It replaced a horizontal rail of description
cards, which on a phone showed one and a half cards and hid the other twelve
behind a swipe.

```
heading  clamp(28px,5.5vw,32px) 800, on a radial wash of the current party's
         colour at 0.2, fading to 0 at 70%
group    label 12px 800 .08em uppercase #5b6067
items    §2.6 signposts, ONE PER ROW, gap 8, each with a 24px tinted circle
         holding its own 14px icon
frame    18px above the heading, 22px under it, gutter clamp(18px, 5vw, 36px)
```

Four groups, named for what the reader is trying to do rather than what kind
of page it is: Work out your vote, Where you live, Keep up and have your say,
New to this. Fourteen signposts in one column is a list to be got through; the
same fourteen under four short headings is four short decisions.

Two things were tried and reverted. **Two columns:** the tapered end eats into
the label, so the longer names wrapped to two lines and the points ran at the
gap between the columns. **A rule across the top:** it read as the page ending
rather than a section starting, so the heading and the space above it do that
job, as everywhere else on the page. 18px of air above the heading, not 48: the
section before already carries 26px under its last signpost.

**§2.6 says one signpost per section at most, and this section is fourteen of
them.** That holds where a signpost is the way out of a block of content. Here
the signposts are the content, and there is nothing else in the section for
them to out-shout.

### 2.11 Filters button — `bills-tracker-54.tsx`

Search, policy area, party, type and stage sat open above the list, with a
submissions toggle and a Clear under them. On a phone that was five full-height
rows before the first result: most of a screen spent on questions the reader has
not asked yet. All of it except search is behind one button now.

```
button   padding 10px 14px · radius 10 · 13.5px 700 · icon 15 · chevron 14
at rest  1px BORDER on white, INK
narrowed 1px JADE on #ecfdf5, JADE text, and the COUNT of active filters
phone    .bills-filters becomes grid 1fr 1fr, gap 6; search spans both columns;
         inputs and selects drop to 7px vertical padding and 13px;
         Clear spans the row at 6px 12px
```

**Search stays outside the button.** It is the one control a reader arrives
wanting, and it is also the only one whose state is visible without opening
anything, since what you typed is sitting in it.

**The closed button carries the count.** Without it, a reader who filters, then
scrolls into the list, has no way to tell a short list from an empty subject
except by scrolling back and opening the panel. `narrowed` counts the four
selects plus the submissions toggle, and search is deliberately not counted
because it is visible in its own right.

### 2.12 Ballot rows — `src/components/bills/ballot-bills.tsx`

The members' bills lodged in the ballot and waiting on a draw. All 72 of them
(`MEMBERS_BILLS_META.total`, as at 24 June 2026) existed in the data and were
shown nowhere, which is the question in §8 that found them.

They are ROWS, not §2.3 tiles, and that is a deliberate divergence. A proposed
members' bill has a title and an MP and nothing else: no stage, so the §2.5
strip has nothing to draw; no bill number; and no page on parliament.nz to open.
A tile that opens into a panel with one fact in it is a worse answer than a row.

```
VISIBLE = 8 rows, then "Show {hidden} more" / "Show fewer"
filtered by party through the same §2.2 pills the tracker uses
```

**It is a section of its own rather than rows in the tracker.** Counting them in
would make "of 285 bills" wrong, they cannot carry the stage filter, and they
are not "before the House" in Parliament's own sense. They are also not "not
passed": they are not yet drawn, which is neither. Keeping them adjacent but
separate is what lets both counts stay true.

### 2.13 Track control and the account dialog — `src/components/bookmarks/track-with-account.tsx`

Tracking asks for an account, and asks on the page.

```
control  padding 5px 10px · radius 9 · 12.5px 700 · bookmark glyph 13px
         at rest  white, 1px BORDER, SECONDARY text, accent on the glyph only
         tracking #ecfdf5, 1px #a7f3d0, JADE
hit area button padding 9, margin -9 (§3.1)
dialog   scrim rgba(20,16,12,.42) · panel max-width 380 · radius 16
         4px accent top border · max-height 88vh
```

**The sequence matters and there were four steps.** It started as an invitation
card at the foot of the page with its own Track button, which meant two controls
doing the same job (§1.3). Then the card's copy was general rather than about
the topic you were reading, because an account follows parties and MPs too.
Then the duplicate Track came out of the card. Then tracking stopped happening
at all without an account, which is what made the dialog necessary rather than
decorative.

**Anonymous tracking was removed, not hidden.** `useBookmarks` used to save to
`localStorage` when signed out, and sync up on sign-in. That felt free and
promised something it could not keep: a track that lives in one browser cannot
be told to anyone when a position changes, and it goes with the site data.
`toggle()` now returns `{ needsAuth: true }` and writes nothing. Leftover
localStorage from the old behaviour is not SHOWN while signed out, because a
tick on a control that can notify nobody is the same lie, but it is still read
on sign-in so nobody's old tracks are lost.

**The tap is remembered.** The entity that raised the dialog is carried through
the sign-up and toggled the moment a session exists, so the reader gets the
account and the thing they came for without tapping twice.

### 2.14 Directory pills over a grid — `src/components/parties/party-directory.tsx`

> **Retired 24 Sep 2026.** `/parties` is a redirect to `/parties/national` now
> (§2.15–2.16): the directory was a menu of seventeen tiles that each said a
> name and a seat count, so it stood between the reader and the pages they
> wanted. The component is intact and the pattern below still holds wherever a
> grid needs grouping — it is just not on this route any more. `PartySwitcher`
> took over its one unique job, reaching the eleven parties with no seats.

`/parties` had three stacked sections, Governing Coalition, Opposition, and Also
contesting 2026, each with a heading and a count chip. That is a filter the
reader operates by scrolling: the eleven parties without seats sat past six
full-height tiles, three screens down on a phone. One row of §2.2 pills carries
the same three groups and the same counts, over one §2.3 grid.

```
pills   All · Governing · Opposition · No seats, neutral, lit = #efece5 on INK
        tapping the lit one clears back to All
grid    ≤767px  repeat(auto-fit, minmax(min(150px, 100%), 1fr)), gap 8 → 2 cols at 375px
        ≥768px  repeat(auto-fit, minmax(230px, 1fr)), gap 10 → 4 cols at 1008px
card    party light fill · 2px party border · name over seats at both sizes
        ≤767px  radius 11 · padding 8/10/9 · avatar 24 · name 13px, FIXED
                two lines (32) · figure 20px + 11px label · 165x83
        ≥768px  radius 13 · padding 11/13/12 · avatar 32 · name 15px, FIXED
                two lines (36) · figure 24px + 12px label · 246x99
```

**The pills are one neutral treatment, not a colour per group.** Party colour
belongs to parties (§1.6) and it is live in the grid directly underneath.
Giving Governing a green and Opposition a red would be a second colour system,
and a reading of the politics this site does not make.

**The name box is a fixed two lines** for the §2.8 reason: "Outdoors & Freedom"
wraps where "ACT" does not, so the card beside it came out 7px shorter and the
grid staggered down the page. 83px every card, measured.

**The desktop card is the SAME card, bigger.** At minmax(150px) a 1008px column
gives six 161px tracks, so a wide screen got MORE cards rather than BIGGER ones,
and the phone card sat in a row of six with the page's margins doing the rest.
Raising the track to 230 and stepping everything inside it up with it, avatar
24 to 32, name 13 to 15, figure 20 to 24, padding 8/10/9 to 11/13/12, gives four
246x99 cards that are the phone card at scale.

**Scaling is not re-laying-out, and the difference is the whole of it.** The
first attempt made the desktop card a single ROW, name left and count hard
right, which used the width and read as a different object at the breakpoint.
Rejected on sight, correctly: a tile that becomes a row is two designs, and the
reader crossing 768px meets both.

**Every reserved height has to be restated at the larger size, and there are
more of them than you think.** Two lines of 15px is 36px where two lines of 13px
was 32. The seats block is 28px where a 24px figure sits on a baseline and 24px
where "No seats yet" does, so the cards came out 99 and 95. And `.pd-id` has to
reserve the avatar's height whether or not there IS an avatar: only six of the
seventeen leaders have a photograph on file. Each of those staggers appears
BETWEEN grid rows rather than inside one, because grid items stretch to their
row, which is why one of them only showed at two columns and not at three. If a
height is fixed on a phone it is fixed at every width, at a different number.

**Avatars are photographs only.** Eleven of the seventeen leaders have no photo
on file, and the initials fallback filled the grid with two-letter discs that
said nothing the name beside them did not.

**What came off the tile:** the full registered name, which wrapped to two lines
at 165px and is on the profile anyway, and the per-party "39.8% of the House"
chip, which encoded the seat count a second time immediately beside it. The
House-wide split is stated once now, in the bar above the grid.


---

### 2.15 Collapsible section — `src/components/parties/collapsible-card.tsx`

A page section as a closed rectangle that opens when tapped. `/parties/[slug]`
was five open cards in a column: about two and a half phone screens of prose
standing in front of the positions, which is what a reader came for. Closed,
the same five are a menu of what the page holds.

```
frame    #fff · 2px solid tint(accent, .45) · radius 18
         padding 9px 14px · shadow 0 1px 2px rgba(42,18,6,.04),
                                   0 8px 20px -12px rgba(42,18,6,.14)
header   the whole row is the button: padding 0, margin 0, background none,
         border none — the card supplies the padding (§3.1)
         icon chip 26x26 · radius 8 · tint(accent, .12) · glyph 15px in accent
         title 16px/800 INK · chevron 18px in accent, rotate(180deg) when open
body     rendered only while open, marginTop 14
column   gap 10 between cards, not 20: closed they are rows of one list
```

**The icon crosses the server boundary as an element, not a component.** A
lucide function cannot be passed as a prop to a client component; `<Landmark
style={{ width: 15, height: 15 }} />` can.

**One section starts open.** Five closed rectangles give a reader nothing to
read and no reason to open any of them, so the first shows what the rest are
like (`defaultOpen` on Overview).

**A section that is one of five looks like one of five in both states.** A
phone rule used to strip this frame from "Where they stand" — written when that
card was always open, where losing the border bought ~48px of width for the
chip grid. Scoping the rule to the open state was not enough: a section that
loses its container the moment you open it reads as a different kind of thing.
The rule is gone; the chips take the narrower measure.

### 2.16 Identity header — `src/app/parties/[slug]/page.tsx`

What a profile page leads with. Built from parts that already existed rather
than new ones, so the page reads as the same system as `/policies/[topic]`.

```
title     the page's name ("Party Profiles"), clamp(26px, 7vw, 40px)/800
subject   the party AS A PILL, the §2 object /policies/[topic] uses for its
          issue: inline-flex · radius 999 · 3px solid tint(colour, .55)
          background #fff · padding 8px 20px 8px 17px · whiteSpace nowrap
          colour readableOnWhite(party.colour), NOT INK
          12px dot in party colour where the topic pill has its icon
          name > 16 chars → clamp(17px, 4.9vw, 30px), else clamp(24px, 6.5vw, 34px)
row       pill + Track side by side, gap 10, flexWrap — a long name keeps its
          line and Track drops under it
status    tint(colour, .12) fill · 1px solid tint(colour, .35) · 3px 11px
          text readableOnWhite(colour) — never a solid block of party colour
```

**The subject takes the party's colour; the chip beside it does not.** The name
was the same brown-black on all seventeen parties, on a page whose only other
colour is a 12% wash. Once the name is green, a solid green chip under it is
two things shouting the same colour, so the chip goes quiet (§1.6).

**`readableOnWhite` — `src/lib/color.ts`.** Darkens only the colours that need
it, hue untouched, so ACT stays ACT instead of going grey. It had been copied
by hand into two files before the third use moved it here.

**A number is not a headline unless it is about something.** The seat count was
a 150x156 card with a 54px numeral and a drop shadow, sitting between the
party's links and everything the page had to say — a figure that reads **0** on
eleven of the seventeen parties. It is the first stat inside the 2023 election
section now, where the electorate/list split and the rows that describe it
live, and the header keeps nothing that has no company.

**The sidebar is gone.** It held "At a glance" and Leadership; on a phone the
column dropped below everything, so its contents were read last rather than
beside anything. Both moved into the section they belong to, at every width.

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
| Election Centre, whole page | 8,955px, 11.0 screens | **4,764px, 5.9 screens** |
| Election Centre, desktop | 6,251px, 6.9 screens | **3,590px, 4.0 screens** |
| Election Centre, closest races | 1,083px of 5 full-width cards | **~265px**, §2.3 tiles two up |
| Election Centre, countdown row | 299px of a 339px row | **days only**, one tile |
| Learn hub | 2,748px, 3.4 screens | **1,906px, 2.3 screens** |
| Learn module (MMP, beginner) | 3,970px, 4.9 screens | **3,195px, 3.9 screens** |
| Caucus rail, per party | 6 to 40+ MPs tall | **191px fixed**, 4 rows, paged |
| Homepage bills block | 3 lines of detail | **1 line**, "152 now law · 21 waiting to be drawn" |
| Bills total | 3 columns of figures | **one 132px circle**, the rest beside it |
| Bills filter bar | 5 controls always open | **1 button**, count on it when narrowed |
| /parties page | 5484px, 6.8 screens | **2260px, 2.8 screens** |
| /parties, first card | 688px down the page | **307px** |
| /parties tile | 176px, 1 per row | **83px, 2 per row** |
| Election Centre, Key Dates on arrival | 4 cards, ~145px, equal weight | **1 card**, the next live deadline, rest behind a tap |
| Election Centre, hero jump nav | 6 pills, ~40px row | **5 text links**, Key Dates dropped (it is the next section) |
| Party page, whole page | 8,514px, 10.5 screens | **1,906px, 2.3 screens** at 375px, closed |
| Party page, "Where they stand" | 2,997px, expanded on arrival | **a closed rectangle** like the other four |
| Party page, switcher before the name | 311px | one row shorter, pills at phone size (§3.3) |
| Party page, seat figure | 150x156 card, 54px numeral | **one line** inside the 2023 election section |
| Party switcher pills | 5px 11px, 12.5px, dot 8 | **4px 9px, 11.5px, dot 7**, gap 4 |
| Party switcher, "Contesting 2026" | 6 rows | **5 rows**, party name 2 rows higher |
| News list | hairline rules between rows | **one card each**, gap 8 |

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

The first mask was 46px and looked like no mask at all. The grid carries 34px of
bottom padding while collapsed, which is the room the control sits in, so a 46px
fade spent 34 of those 46 on empty space and the tiles still cut off square. The
stops are measured from the bottom of the padded box, not from the last row:
`#000` to `calc(100% - 86px)`, `rgba(0,0,0,.12)` at `calc(100% - 26px)`,
transparent at `calc(100% - 10px)`. Symptom to recognise: a fade you can only
see if you know it is there.

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
  A fourth turned up a day later on /parties, where `54th Parliament{TOTAL_SEATS}
  seats total` had been `54th Parliament — {TOTAL_SEATS} seats total` and was
  rendering as "54TH PARLIAMENT123 SEATS TOTAL". It survived because the sweep
  ran over JSX text where the dash was the only separator between a label and an
  interpolated value. After a sweep, grep the diff for a `}` or `{` sitting
  directly against a word.
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

**5.7 A state change above the fold scrolls the page.** Tapping a party tile
for the first time jumped the reader about 850px. Selecting a party changed the
height of blocks ABOVE the viewport, and the browser's scroll anchoring then
"held position" against the wrong element. Symptom: the jump happens on the
FIRST tap only, because after that the heights are already settled. Fixed by
pinning the scroll for 700ms inside `select()` in `party-cycle.tsx`: record
`scrollY`, restore it on every frame that drifts by more than 1px, and release
early on the reader's own `wheel`, `touchmove` or `keydown`. Restoring without
the release traps a reader who scrolls immediately after tapping.

**5.8 `position: fixed` bubbles drift on scroll.** Fixed positioning centred
the (i) bubble on the screen and then left it there while the page moved
underneath, so it came unstuck from the (i) that opened it. Use `position:
absolute` with a measured offset instead: `window.innerWidth / 2 - width / 2 -
wrapper.getBoundingClientRect().left`, recomputed on resize. Centred on the
viewport, anchored to the page.

**5.9 `clip-path` cuts CSS borders.** A border on a clipped shape is drawn and
then sliced off at the tapered end, and `box-shadow` is drawn for the unclipped
rectangle. Use `filter: drop-shadow(...)` for the shadow, and for an outline
nest two clipped elements: the outer one in the border colour with 2px of
padding, the inner one in the fill.

**5.10 A percentage margin resolves against the container's width.** The
homepage seat count is pulled up into the arch's opening with
`marginTop: '-13%'` rather than a pixel value, so it tracks the chart as the
chart scales. A fixed offset was right at one width and wrong at every other.

**5.11 An inner scroll area eats a phone swipe.** The caucus rails scroll, so a
finger starting on a row scrolled the rail instead of the page and the reader
was stuck in a 191px window. On phones `overflow-y` is turned off in
`globals.css` (`.mp-rail`, under 767px) and the chevrons are the only way to
page. That has to be CSS: an inline `overflow` would outrank the media query.

**5.12 A thing that hides on scroll stays hidden after a jump.** Symptom: the
floating topic pill disappeared correctly at the coverage table, then never came
back for the rest of the session, including on the next topic. It was driven by
a second IntersectionObserver watching the table. An observer reports CHANGES in
intersection, and "above the viewport" and "below the viewport" are the same
non-intersecting state: jump between them, which is what a topic switch landing
at a new scroll position does, and no callback fires at all, so the flag keeps
whatever it had. Reading `getBoundingClientRect().top <= innerHeight` on scroll
always gives the right answer. rAF-throttled and `{ passive: true }`, and it
measures once a frame at most. The observer on the header pill stayed, because
that one only ever crosses.

**5.13 An invisible hit area can make a container scrollable.** Symptom: a table
that fits its box still shows a scrollbar and still swipes about 7px. The §3.1
pattern pads a button out to 44px and pulls the margin back, which fixes the
LAYOUT but not the scroll width: the padded box still overhangs, and a container
with `overflow-x: auto` counts it. The pager sitting at the right edge of the
coverage band overhung by 7px exactly. Fix is padding on the cell
(`padding-right: 14px`) so the hit box ends inside the container, not a change
to the button.

**5.14 A `useMemo` filter needs every derived value in its deps.** Symptom: a
filter clears in the UI, the banner goes, and the list stays filtered. The
tracker's topic filter is a `Set` built in its own memo; the filtering memo used
it but did not list it, so clearing the topic rebuilt the Set and never re-ran
the filter. It is the ordinary exhaustive-deps warning, and it is worth naming
because the symptom looks like a state bug rather than a dependency one.

**5.15 A shared component's phone sizing can live in one caller.** Symptom: the
same component is correctly sized on a phone on one page and desktop-sized on
another. `bill-journey.tsx` ships no CSS of its own; the 18px bead and 9.5px
label live in `defining-bills.tsx`'s style block. On /bills that works by
accident, because both components are on the page. Anywhere else the journey
renders at desktop sizes. This is §3.2 in its other form: shipping the CSS with
A component is not the same as shipping it with THE component.

**5.16 A fixed inline size opts a control OUT of the 44px minimum.** §3.1 is
written against the symptom of a control INFLATED to 44px by
`button { min-height: 44px }`. The obvious cure for that, an inline
`minHeight: size`, is the same bug pointing the other way: an inline style beats
a stylesheet rule, so `ui/info-button.tsx` rendered a 24px circle as a 24px
target, on every page of the site, for as long as it has existed. Symptom: a
control that looks right and is exactly as tall as its glyph. The cure is §3.1's
own pattern, and it must be applied VERTICALLY ONLY. Padding all four sides also
reaches 44px, and then the box overhangs its row horizontally, which is §5.13
(an invisible hit area making a container scrollable) and which put the (i)'s
hit box over the pill beside it. Height is the binding constraint; a round
control is already wider than it is tall against a 44px floor.

**5.17 Cutting a duplicate can take the one fact it did not duplicate.** The
Election Centre's hero subline restated the enrolment date, the advance-voting
window and the source, all of which the Key Dates strip carries from the same
file, so it was cut as a textbook §1.3 duplicate. It was also the only thing
that rendered `endDate`: the strip's tile says "Advance voting opens" and stops.
6 November was stated nowhere on the site until a review caught it. Before
deleting a block, check each fact in it against the thing you believe duplicates
it, FIELD BY FIELD, not block by block. A block that restates four facts and
adds a fifth looks exactly like a block that restates five.

**5.18 `auto-fill` holds empty tracks open; `auto-fit` collapses them.** The two
are identical while the tiles outnumber the tracks, which is every grid in this
document at 375px and most of them at 1280. They diverge exactly where a grid
holds FEWER tiles than its row has room for, and the result is a row half full
with the tiles jammed left. Measured at 1440: /parties filtered to Governing,
three tiles in six tracks, **50%** of the row; /learn filtered to Making law,
two tiles in four tracks, **49%**; the Election Centre's two vote tiles, two in
six, **37%**; closest races, five in six. Every one of those looked correct on a
phone, because two tracks is the whole row there, which is how the whole set
shipped. `auto-fit` everywhere; there is no case in this codebase that wants the
empty track. Symptom: a filtered list that hugs the left edge with nothing
beside it, and only on a wide screen.

**5.19 A page composed at 375px has to be looked at at 1920.** The pass that
produced §3.3's numbers was measured at 375 and spot-checked at 1280, and both
of those hid §5.18 and a card that was 72px wider than every other block on its
page. A block that is full-bleed on a phone is a block of some other width on a
desktop, and which one is a decision, not a consequence. Check three widths:
375, 1280, and 1920. At 1920 the test is whether every block on the page starts
and ends on the same two vertical lines.

**5.20 A prominent CTA and a duplicate deadline are the same request read two
ways.** Asked to give the Election Centre's hero a strong single call to
action, the obvious read was a card in the hero itself: "Enrolment closes
25 Oct" with an enrol button. That is exactly the hero subline §1 of this file
already records removing, because KeyDates — the very next section, no gap —
states the same date from the same file. Adding it back to satisfy the CTA
request would have restored the duplicate the earlier commit paid to remove.
The request and the existing rule were not in conflict; the literal reading of
the request was. Read as "the reader should meet one unmistakable deadline
card early," not "put a date card in the hero," it resolves the same way §1.3
already points: collapse KeyDates itself down to the one live milestone
(§3.3's row below), so the section immediately under the hero *is* the CTA,
and the hero's own job shrinks to getting out of its way. When a new request
would recreate something already deleted for a stated reason, look for the
version of the request that doesn't.

---

### A rule written for an always-open thing outlives the always-open thing

`.ap-stand` stripped the card chrome from "Where they stand" on phones, which
bought ~48px of width for its chip grid. The section became collapsible and the
rule stayed, so the card had a frame until you opened it and then lost one.
Narrowing the rule to the open state was the same bug with better aim. **When a
component's behaviour changes, re-read the CSS that was written for the old
behaviour — the reason it existed may have gone.**

### Reading the request in a server component costs the whole route

Not a design rule, but it shaped a day's work and will happen again. In the App
Router, `await searchParams`, `cookies()`, or any Supabase client that touches
cookies opts a route out of static rendering entirely, whatever `revalidate`
says. Measured on production: prerendered routes answer in ~0.2s, the rest in
1.3-2.9s.

- `/bills` awaited `searchParams` for `?party=`; the client tracker reads the
  query itself now, behind `<Suspense>`.
- `getApprovedBills` used the cookie-bound server client for public content;
  `lib/supabase/public.ts` exists precisely for this and says so.
- The homepage called `getSession()` to redirect signed-in visitors, so every
  visitor to the page campaign traffic lands on paid for it. That moved to
  `proxy.ts`.

**Next 16 renamed middleware to proxy, and this repo has `src/proxy.ts`.**
Adding a `src/middleware.ts` beside it makes *every route on the site* 404 with
the reason only in the dev log.

### A loading bar is not a loading time

Reported as "why am I waiting, is it the animation?" — it was not.
`RouteProgress` starts on the click and finishes 160ms after the route commits,
with no minimum. But a route with no `loading.tsx` leaves the PREVIOUS page on
screen for the whole wait, so the bar is the only thing moving and the click
reads as having missed. **Every slow route needs a `loading.tsx`**; there is a
root one now for anything without its own.

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
6b. **Then measure at 1920.** Do every block start and end on the same two
   vertical lines? Does every grid still fill its row with its smallest filter
   applied (§5.18)? A phone-first page is not finished until it has been seen
   wide (§5.19).
7. **Check the claims.** Anything stated as a figure needs a source you can put
   under it, or it does not ship.

## 7. Open, and deliberately not done

- `topic-info-button.tsx` and `bills-info-button.tsx` still hold their own
  copies of the (i) pattern; fold them into `ui/info-button.tsx`. They did not
  get §5.16's hit-area fix, because it was made in the shared component only, so
  the (i) on /policies/[topic] is still a 26px target.
- `learn/reveal-cards.tsx` has zero importers since /learn moved to
  `module-reveal-cards.tsx`. Second instance of the trap this section already
  records for `party-tile.tsx`: delete it before something imports it by name.
- The (i)'s 44px hit box overlaps an adjacent control by 12x3px on
  /elections/2026 and 26x12px on the homepage's caucus box. Inherent to §3.1
  wherever two controls sit within 10px of each other, and a 24px target is the
  worse trade, so it stays. Recorded so it is not rediscovered as a bug.
- `src/lib/learn/xp.ts` still computes `xp`, `level`, `xpIntoLevel` and
  `xpForLevel`. Nothing renders them since the hub card took over from the
  progress banner.
- The Election Centre's `section-rail.tsx` and `policy/floating-topic-pill.tsx`
  are still two floating section navigators. Both are `position: fixed`, both
  track scroll, both expand into a stack. One §1.4 component, not two.
- KeyDates is not the §2.5 journey strip. The prerequisite landed (the strip
  ships its own CSS and takes `progress`), but a statutory timetable is a
  sequence of deadlines rather than stages a thing passes through, and the tiles
  carry a date each that beads cannot.
- ~200 of the 285 tracked bills have no summary. The machinery exists
  (`scripts/enrich-bills.mjs` — Claude grounded only in the official bill text,
  then an editor approves); it has not been run across the backlog.
- The ballot list is dated 24 June 2026 and is **hand-transcribed** into
  `scripts/build-members-bills.mjs`. Refreshing it means re-transcribing.
- The Treaty Principles figures come back only with a citation each: the Justice
  Committee report for the submissions count and the share opposed, Hansard for
  the vote.
- `homepage/seats-info-button.tsx` is a third copy of the (i) pattern, and it
  closes on an OUTSIDE TAP, which §2.1 rules out for exactly the reason given
  there. Its sections are short enough that nobody has been shut out
  mid-sentence yet. Fold it into `ui/info-button.tsx` with the other two and
  the divergence goes with it.
- `bills-info-button.tsx` still carries `aria-label="What bills before the
  House means"`. The visible copy stopped saying "before the House" when §1.7
  was applied; the label did not follow it.
- The electorate and list seat split is no longer shown anywhere. The numbers
  are still in `elections-data` (`electorateSeats` / `listSeats`). It is the
  clearest illustration of MMP there is and belongs on the Election Centre,
  where the mechanism is the subject, not on the front page.
- The homepage seat count is the OFFICIAL 2023 result, while `MP_PROFILES`
  holds the current caucus. National reads 48 in the arch and 49 in the
  directory, because the Port Waikato by-election added a seat in November
  2023. The (i) explains it. Nothing reconciles it.
- §2.12 diverges from §2.3 on purpose: the ballot bills are rows rather than
  tiles, because a proposed members' bill has a title and an MP and nothing
  else, so a tile that opens would open onto one fact. Recorded here rather
  than loosened in §2.3, which still means tiles for anything with a status and
  a detail to show.
- `bill-journey.tsx` has no CSS of its own and gets its phone sizing from
  `defining-bills.tsx` (see §5.15). Correct on /bills by accident, wrong
  anywhere else the strip is used.
- Economy on /policies/[topic] still takes the whole "Work & social" bill
  category, which is employment, wages, ACC, welfare, superannuation, privacy
  and consumer law. Immigration was narrowed to a title match for exactly this
  reason and Economy was left, on the argument that employment and wages ARE
  economic policy. Privacy and consumer credit are the ones that do not belong.
- 98 of the 283 tracked bills are category "Other" and therefore appear under no
  topic at all. The categoriser is a title keyword list in
  `scripts/build-bills-54.mjs`, so fixing it is a data rebuild.
- Where Supabase requires email confirmation, sign-up returns no session, so the
  track a reader tapped cannot be saved yet. The dialog says so and asks them to
  tap Track again after confirming. It is honest and it is still two steps.
- `src/components/parties/party-tile.tsx` has no importers since §2.14 replaced
  it. It holds `PartyTile`, `PartyTileGrid`, `PlainPartyTile` and
  `TileGroupHeading`. Left in the tree rather than deleted while other sessions
  are working in it, which means an orphan that looks like §2.3 is sitting there
  to be picked up by mistake.
- ~~`/parties/[slug]` is untouched.~~ **Done 24 Sep 2026** (§2.15–2.16). The
  8514px / 10.5 screens measured here is now 1906px / 2.3 screens closed; the
  switcher's 311px came down with the phone-size pills (§3.3); "Where they
  stand" was 2997px and expanded on arrival against §1.1, and is a closed
  rectangle like the other four.
- `src/components/parties/party-directory.tsx` joins `party-tile.tsx` as an
  orphan: `/parties` is a redirect now, so nothing imports it. Same reasoning —
  left in the tree while other sessions are working nearby, and worth deleting
  together once they are done.


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

Both nav groups went for the same reason, one after the other. "The Record" held
Bills tracker, Budget 2026 and Parliament; "Your Electorate" held Electorate
map, Battlegrounds and MPs directory. In both cases the label named the grouping
and not the destinations, and every item inside cost an extra tap. Six pages
that were two taps deep are one tap deep now. The test for a group: does its
label name somewhere a reader could want to go? "The Record" does not.

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

> "How does this section relate to the different issues?"

These are the most valuable messages in the whole day. Each exposed something
the design was hiding: 72 ballot bills that existed in the data and were shown
nowhere; three unsourced figures on the one bill whose subject is a single
party; ~200 bills with no summary and no acknowledgement of it; and a status
label that could be read as the opposite of what it means.

The last one was asked about "What's been legislated this term" on a topic page
and the honest answer was that it did not relate to the issue much at all. Bills
were matched to topics through one broad keyword category each, so Immigration
was showing all 16 bills in "Work & social", including holidays and consumer
credit, under a sentence that read "this Parliament has 16 bills passed into
law" on immigration. Three of them were immigration bills. That is a false
claim, not a loose filter, and it only surfaced because somebody asked how the
section worked.

**When the reader asks "where did this come from?", the answer is a design
problem, not a support question.**

### Ask before you rebuild

> "stop what are you redesigning??"

Sent four commits into a redesign of /parties that had been asked for. The brief
was real and the work was the work; what was missing was showing anything before
doing all of it. A page that arrives finished cannot be steered, and the reader
who asked for it has to either accept it or unpick it. Compose the first screen,
show it, then carry on. Cheap to do, and it is the difference between a redesign
and a surprise.

### Tracking, and what a free thing is allowed to promise

> "I need that when I tap "Track immigration changes" and I'm not logged in, or
> for any sort of tracking when I'm not logged in, it always pulls up "Create a
> free account." That doesn't move from the page. Does that make sense? When I
> create that account, it automatically saves the track, and it has that track
> with a tracking tick."
> "Tracking should only happen if you have any cart." → "an account"
> "instead of having this box specific to one issue, I want it to be more general"

The first message is a complete specification, including the part that is easy
to skip: the tick has to be on when they come back, without a second tap. The
second one is a voice-to-text slip and the correction is one word, which is
worth keeping because the rule it lands on is the strict one: not "prompt for an
account", but "do not track at all without one". The anonymous localStorage path
that existed was the comfortable answer and it was the wrong one, because a
track that cannot notify anybody is not tracking.

### Compose for the phone, not for the pane

> "it seems you've not followed my instructions for mobile format so everything
> you see when tab responsive in preview should be for mobile" / "in terms of
> composing"
> "why is it liike this then??" / "when i tap mobile on preview"
> "each of these should be on their own row"
> "these should be more compact meaning dont waste space"

The preview pane at 375x812 is **the canvas**, not a check at the end. A layout
composed wide and then made to survive a phone is a different layout from one
composed on the phone, and the difference shows in what gets its own row.

### Make the explanation match what it explains

> "11.6% of the party vote does that mean?"
> "11.6% of the party vote I don't think that is clear enough for the everyday
> user to understand what that means. Can you instead change this to something
> easier to understand? 11.6% of what? Give me some examples."
> "so they originally won 49?"
> "Why does Nationals not add up to 48? It adds up to 49?"
> "2 electorate · 9 list I don't get this."

Four questions about one block of numbers, and none of them was about the
design. "11.6% of the party vote" is correct and assumes the reader knows MMP
has two votes; "11.6% of voters chose National" is accurate about WHO without
making them learn the mechanism first. The 48 against 49 turned out to be a
real inconsistency in the data, not a misreading. "I don't get this" on the
electorate and list split ended with the split being removed: a fact nobody
asked for, explaining a mechanism that is not what the front page is for.

### Match a thing that already exists

> "make the border same as first section style"
> "It needs to perfectly match the dome with exact margin"
> "Full 2023 results should match same as this and put it under the box below"
> "make this asame as see nz first bills style button"
> "the lie under heading should always align"
> "make the outline border of these smaller in weight, same as the outline of
> the seats diagram"
> "see the edges dont align butttons with trianglees always on margin same place"

"Perfectly" and "exact" are literal. The arch was redrawn from the seat
coordinates rather than fitted by eye, and the signposts were pulled out to the
page gutter with a negative margin
(`marginLeft: 'calc(-1 * clamp(18px, 5vw, 36px))'`) so every one of them starts
on the same vertical line. **When a margin is described as wrong, measure the
two things rather than adjusting one until it looks right.**

### Reverting is part of the instruction

> "lets add gradient at end to fade the arrow end of the button as a test"
> "fade to o at end of arrow buttons"
> "actually nah go back"
> "where you gradient the end off firt"
> "CREATE TWO COLUMNS remove the arrow and the triangle ends" / "go back to the
> triangles" / "dont make it two column"

Two of these ended back at an earlier version and one ended part way: the
signposts kept the gradient at 35% and did not keep the fade to nothing. Keep
each step recoverable, and read "as a test" as meaning exactly that.

### A page that doesn't follow the redesign, even after it's been redesigned

> "this page does not have flow nor follows design changes I want you to
> discuss with me making this page way more user and flow easy including
> sections design everything based of MD design lets talk"

Said about the Election Centre, which had already had one redesign pass
(§3.3's 11.0-to-5.9-screens row). The instinct to check was "what does the
spec actually say I'm still missing," not "redo the page" — the page was
observing §1.1 and §2.4 correctly throughout; what it was missing was closer
to the surface: a hero with six equal-weight pills and no single next step, a
Key Dates section that opened fully expanded against its own page's rule, and
two screens of flat cream before any colour appears. **A page can follow every
numbered rule in this file and still not have this file's flow**, because flow
is about which section gets the reader's first tap, and no rule here states
that directly — §6's checklist doesn't have a step for it. Worth adding one
next time this file gets a real edit: after §6.5 ("match the shapes"), ask
what a first-time reader's ONE most useful action is, and check that the page
gets them there before it shows them anything else.

### Land them on the thing, not on a list of things

> "this page i want replaced...instead have it default to the nationals page
> https://politika.nz/parties/national"
> "but change the slug to match this"

An index whose every row says only a name and a count is a menu in front of the
pages people actually want. `/parties` redirects to the first party now, and
the switcher already on that page carries all seventeen. The second message
matters as much as the first: a redirect, so the address bar shows the party
being read, not a rewrite that keeps the old URL.

### Match a thing that already exists, again

> "Can we put that title of the party behind, in front of a white pill, like
> how you've done it on the party policy comparisons with the issues, but
> instead it's the party name?"

Not "make it a pill" — make it *that* pill. The answer was to copy the numbers
out of `/policies/[topic]`'s heading, including its rule that names over 16
characters take a smaller size, and change only what a party has that a topic
does not (a colour dot instead of an icon).

### Fold it up

> "Let's compact all of these sections in a rectangle of the same style as the
> containers. For example, 'Overview' will only read 'Overview', and then when
> you tap into it, it expands the boxes."
> "have overview already open"
> "gaps too big"

Three messages, one idea arriving in stages: fold the page into a list, then
give the list something to read, then make it look like a list instead of five
drifting cards. The second and third were not corrections — they were the parts
of the idea that only become visible once the first is built.

### Say why it is one thing and not another

> "All of these should be clearly separate things, so put some sort of
> background behind each of these."

Five headlines split by hairlines read as one list of sentences, because most
of them run to two lines and a thin rule between two blocks of text is just
more text. A background is what says "separate thing".

### Not everything needs to survive the move

> "Remove 'founded' and instead put the same box and information into the
> Legislative Record this term, and change the Legislative Record this term to
> 2023 election."

Moving a block is a chance to drop the row that never belonged in it. Founded
was the one line in "At a glance" with nothing to do with 2023.

### Ask what you are actually waiting for

> "how can I speed up loading time?"
> "Okay so why am I waiting? Am I waiting for the animation and loading?
> There's an animated loading bar at the top. Does it wait every time?"

The second question is the one that found the answer. It was not the animation
— but asking made the difference between "the site is slow" and a measurement
showing prerendered routes at 0.2s and the rest at 1.3-2.9s, which named the
cause exactly. **Measure the live site before changing anything**; the fix was
six lines of config, not a rewrite.
