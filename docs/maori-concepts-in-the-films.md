# Māori concepts in the policy films

Working document, 14 October 2026. Written after a grounded review of how the six
housing explainers currently draw papakāinga, whenua Māori and wāhi tapu.

The short version: one frame is a genuine bug and should be changed today; a
second is an asymmetry that should be evened up today; and the *positive*
question — how to draw a papakāinga or a wāhi tapu well — is not a question a
designer should answer alone, and is the thing to get a named reviewer for.

---

## 1. The one real bug: the ACT film's "spiritual" circle

`scripts/.scratch/act-housing-explainer/film.js`, lines ~256–273.

The frame draws two circles of equal radius side by side:

| | stroke | ink | contrast on cream | fate |
|---|---|---|---|---|
| "you can point to" | `lw: P(7)` solid | `MID` | 5.66:1 | persists |
| "spiritual" | `lw: P(6)` dashed (10 arcs) | `SOFT` | 3.51:1 | **fades to nothing** |

The code comment says it is neutral "because they are the same size and weight".
**That is false in the file.** The spiritual side is a thinner stroke, a lighter
ink, a broken outline, and the only one that disappears. Four separate signals
all pointing the same way, and the series has already taught the viewer what a
dashed outline means — in *this same film* a dashed box is "how many homes? they
do not say", and in the Greens film a dashed line is the unfilled aim. Dashed
means *not real* here by established convention.

Three further faults in the same frame:

- **The fade shows a policy working.** An element erased on screen is a campaign
  pledge performed as an accomplished removal. No other party's film is allowed
  to depict its policy succeeding.
- **It deletes ACT's own qualifier.** Their position is that a spiritual claim
  "could not, *on its own*, be treated as an adverse effect." A thing that is
  *gone* is not a thing that is *insufficient on its own*. Erasing the circle
  misstates the policy as more absolute than ACT states it.
- **"You can point to" is the film's phrase, not ACT's,** and it is a merit
  claim. Against a bare category word it asserts that spiritual claims are
  unpointable — which the Heritage New Zealand Pouhere Taonga Act 2014 s6
  contradicts by defining a wāhi tapu as *a place*.

Also: "spiritual" is not the legal category. The real categories are wāhi tapu
and wāhi tūpuna (HNZPTA 2014), sites of significance in district plans, and
RMA 1991 ss 6(e), 7(a) and 8. "Spiritual" is one of five alternative senses in
the s6 definition.

### The fix

Delete the two circles, the 10-segment dash loop and the `gone` term. Put ACT's
clause in the empty left band in the same ink, size and weight as the
surrounding text, under the `ACT SAYS` pill that is already correctly on screen
for this line, with a date stamp. No new picture, no new drawing routine — the
existing `para()` helper and `G.text` are enough.

This is the only change here that needs no cultural review, because it draws
nothing: it removes an editorialising picture and replaces it with the party's
own words.

---

## 2. The staging problem behind it

Computed from the ACT score:

```
66.6  padlock on the CONSENT sign swings open
66.6  gate lift stage 1          (ACT's builder sign-off)
72.0  gate lift stage 2          (ACT's objections change)
72.5  three houses begin driving through the gate
75.0  the spiritual line begins  ───────────┐
75.6  the last house completes its passage  │  0.6s of motion overlap
85.0  scene ends                 ───────────┘
```

Only 0.6 seconds of *motion* runs under the spiritual line. But the *state*
holds for the full ten seconds: an open padlock, a fully raised gate, and three
houses parked through it. For the whole of the one line in the series that
touches Māori spiritual significance, the backdrop is the policy having already
succeeded.

**On the padlock specifically, I disagree with part of the review.** It was asked
for deliberately, and it is on the word *consent* — a council permission, which
is exactly what ACT proposes to reduce. That is not the same as the padlock this
series already cut from the TPM film: that one sat on *whenua*, and no party
proposes removing Māori land protection, so it put a policy in their mouth. A
lock on a council consent is a lock a party genuinely proposes loosening. **It
stays.**

What should change is the staging, not the metaphor: retime the last house so no
motion runs under the spiritual line, and give the frame something to say during
those ten seconds (ACT's clause, per §1) other than "look, it worked."

---

## 3. The papakāinga asymmetry

`green-housing-explainer/film.js`, the `who` scene. The three Greens asks are
drawn as:

| slot | glyphs | qualifier caption |
|---|---|---|
| 0 · papakāinga | **one** house, scale 0.84 | "on their own land" |
| 1 · developers | **two** houses, scale 0.70 | "some affordable" |
| 2 · committees | **two** figures, scale 0.84 | "renters too" |

**Correction to an earlier draft of this document**, which said papakāinga was
the only slot with no qualifier. That was wrong: film.js:392 draws "on their own
land" at the same size, weight and ink as the other two. Checked in the source.
The asymmetry that IS real is the glyph count — one against two — and that is
the smaller half of the problem.

The real problem is the glyph itself. It is the *same* `house()` used for
private-developer stock, whose settled meaning in this series is a separately
ownable dwelling — the one thing a papakāinga dwelling is not, since TTWMA
s148(3) denies an owner of an undivided interest the capacity to alienate it
separately. Te Aka's sense of papa kāinga is "original home, home base, village,
communal Māori land", and Te Puni Kōkiri's own guidance says "generally 3-10
houses", so one house is below the floor of every source available.

The film's own CIVIC line defines papakāinga by a **relationship** — "by the
people who belong to it" — and an identical generic glyph is precisely what
cannot carry a relationship.

Evening up the asymmetry is a fair fix and needs no review. Choosing a *new
picture* for papakāinga does need review (see §5).

---

## 4. Copy corrections — checkable to a subsection, do these regardless

These are factual, not aesthetic. Each is verifiable against a statute or a dated
official figure, and none of them depends on any design decision.

| film | currently says | should say | why |
|---|---|---|---|
| TPM | "one block can have hundreds of owners" | "one block · on average 111 owners" + dated source | The Māori Land Court's 2025 update gives 111 as the overall average; 211 is the average only for blocks *with a land management structure*. State a dated average, not an impression. |
| TPM | step 1 "offered to / whānau first" | "offered first to / whānau and hapū" | s4's preferred classes are wider than whānau: children and remoter issue, whanaunga associated with the land in accordance with tikanga Māori, other beneficial owners who are members of the hapū, trustees, and descendants of former owners. |
| TPM | "no bank will take a share of it as security" | the s148(2) statutory incapacity | The current line is a claim about how banks behave. The checkable claim is that a share may be mortgaged only to Public Trust, Kāinga Ora–Homes and Communities, or the Māori Trustee. |

Two things to avoid overstating in the same breath:

- **Do not imply Māori freehold land cannot be sold.** Selling is *gated*, not
  banned. Only Māori customary land and s338 reservations are effectively
  unalienable, and mortgagee sale is expressly excluded from "alienation".
- **Do not show homes multiplying after the July 2026 change.** The Crown's own
  Regulatory Impact Statement says the papakāinga standards do not address
  finance, owner agreement, landlocked land, regional consents or natural
  hazards. The change touched district-plan rules only — which the TPM film
  already says correctly.

---

## 5. The discipline

### Decide alone, today

1. **No dashed, broken, dotted or faded outline for any Māori legal or cultural
   category.** In this series a dashed line already means "unfilled" or "they do
   not say". Using it for a category of law assigns that meaning to the category.
2. **Nothing is erased, dissolved, shrunk or crossed out to depict a proposed
   exclusion.** That depicts a policy working, which the series forbids
   everywhere else.
3. **Te reo is set in the same ink, size and weight as the English in its
   element group.** Never `SOFT` where the English is `MID`. No italics, no
   quote marks, no scare-quoting a reo term. Macrons always — the engine's Inter
   400/700/800 all carry ā ē ī ō ū, so there is no technical excuse.
4. **No restriction visibly comes off when a party's policy lands, on anything
   Māori-coded.** (The ACT consent padlock is not Māori-coded — see §2.)
5. **No borrowed motif.** No koru, kōwhaiwhai, tukutuku, poutama, mangōpare,
   niho taniwha, tiki, whakairo, tā moko. Not as decoration, not as an icon.
   These are not ours to deploy and nothing citable tells us which would be
   appropriate here.
6. **No "ancestral landscape" mood.** No mist, hilltop, winding river, aura or
   glow. The subject is a title class and a planning rule, not a landscape type.
   A mood is not a mechanism.
7. **Don't draw, name, locate or number any actual wāhi tapu, urupā or named
   site** — and a generic headstone or burial-ground shape is a stand-in for one.
8. **No fences, driveways, internal section lines or cul-de-sacs in a papakāinga
   picture.** "Nobody owns a separate section" is the load-bearing fact; the TPM
   film already treats the *absence* of internal lines as the fact itself, which
   is the right instinct.
9. **Comment hygiene.** A code comment that certifies a check must not outlive
   the check. Two live examples: the ACT "same size and weight" note, which is
   false in the file; and `tpm-housing-explainer/film.js`'s header, which still
   says "THE LOCK STAYS ON. In the whenua scene the land carries a lock" when
   that padlock was already removed and replaced by three numbered steps.

A caution on rule 5 and 6: do **not** generalise these into "no picture for any
Māori concept". That rule eats itself — Māori freehold land is a Māori concept,
and the TPM block diagram is the best Māori-subject frame in the series. The
rule is *no borrowed motif and no mood*, not *no mechanism*.

### Do not decide alone

The positive composition — what a papakāinga or a wāhi tapu actually looks like
on screen — is not a design decision. The distilled questions that genuinely
gate the work:

1. Should a papakāinga be depicted at all in this series, and if so, who
   reviews the frames before publication?
2. Is "papakāinga" even the right word for what each party is proposing, or does
   using it to label a party policy misuse the dictionary sense?
3. Should a wāhi tapu be depicted at all — even abstractly as an unnamed bounded
   area on a plan — or should the film draw the *document* and never the place?
4. Should the words wāhi tapu / wāhi tūpuna / urupā appear on screen in a film
   about a proposal to narrow that category, where the term sits next to the
   proposal? Does naming them there do harm that not naming them does not?
5. Is it acceptable to draw owners as marks *on* whenua, or does depicting
   people as dots on land read as something other than intended?
6. Does covering this ACT proposal on screen at all — in a series where every
   other party's film is about pipes, money and consents — give disproportionate
   prominence to a proposal about Māori spiritual claims? Would the fair answer
   be to cover it in a written explainer instead?
7. Who holds the veto on the finished cut, **by name**, with authority to stop
   publication?

MfE's own papakāinga consultation document says understanding of papakāinga "may
differ from hapū to hapū" — which means a single canonical picture may be the
error however well it is drawn. That is a strong argument for drawing the
mechanism (title, owners, the three steps, the planning rule) and not the place.

### Sequencing, which is the real conclusion

The negative discipline, the typesetting rules, the factual copy corrections and
the comment hygiene can all be settled today, by us, without anyone's
permission. The *positive* depiction cannot — and in the Te Pāti Māori and Te Tai
Tokerau films it is not a detail, it is the whole picture.

So the honest position is that the Māori-subject *compositions* of those films
are **not specified by a designer at all** until the review relationship exists.
And if that relationship cannot exist before 7 November, the honest consequence
is a written explainer on politika.nz — not a cautious frame shipped unreviewed.
Drawing less is not the same as drawing safely.

---

## 6. A grounded visual vocabulary

Researched 14 October 2026 against how Māori designers, councils and the Māori
Land Court *actually* diagram this — because the way not to be flippant is to
follow real practice rather than invent a respectful-looking picture.

### The find that matters

**Te Tai Tokerau Papakāinga Toolkit** (Northland Regional Council with the Far
North, Whangārei and Kaipara district councils), in its "Forms of Māori Land
Ownership" pages, draws **the same block six times**. Single collective title,
occupation order, licence to occupy, lease, partition — one rectangle, redrawn
identically, with different writing on it each time, and a line labelled ROAD
along one edge as the only external context. Owners appear as a list of letters
*beside* the block, never as divisions of it.

That is a complete diagrammatic convention for exactly our subject, from a real
papakāinga toolkit, and it independently matches the instinct already in the TPM
film — no internal division lines, nothing unlocks.

### The marks

| mark | means | grounded in |
|---|---|---|
| **The edge** — one unbroken boundary, interior never divided | One title held in common. An interior line would mean a separate title has been created, so there are none. | Te Tai Tokerau Toolkit; already the TPM film's own instinct |
| **Relabel, never erase** | A legal change is the *byte-identical* rectangle with different text on it. Nothing unlocks, fades, shrinks or is removed. | The Toolkit's six panels are literally this method |
| **The owner register** — a dated count in type, *outside* the edge | Ownership is an entry against a title: proportional, and **not located** anywhere on the ground. | Māori Land Court, *Māori Land Update*, June 2025 — the Court's own unit is the "allocated ownership record", 3,136,458 of them, averaging 111 owners per block |
| **Unequal whare, turned in** — three or more, never one, never identical | A range of dwellings for one group of people. | Te Puni Kōkiri: "generally 3-10 houses"; *A Guide to Papakāinga Housing* (2017) |
| **The worked share** — a labelled māra kai | A papakāinga lawfully contains things that are not houses. The cheapest mark a developer's stock glyph cannot carry. | NES-P definition D11: māra kai "means food garden" |
| **The access edge** — one ROAD line, one side, nothing else outside | A block with legal access. The whole of the external context we claim to know. | Every one of the Toolkit's six panels |
| **The consent ladder** — thresholds as chips, none ever marked reached | The planning rule is a scale set by law, including what it does not reach. | Resource Management (National Environmental Standards for Papakāinga) Regulations 2026, SL 2026/166, in force 2 July 2026 |
| **Provenance on every Māori figure** — source and date, same ink tier as its caption | | Te Mana Raraunga, *Principles of Māori Data Sovereignty*, Brief #1 (2018), 2.1: "All data has a whakapapa" |
| **The instrument card** — draw the document, never the place | For wāhi tapu. HNZPTA s6 separates the place from the land category in its own structure. | HNZPTA 2014 s6 |

**The reframe, in one line:** stop drawing papakāinga as a kind of **house** and
draw it as a kind of **ground**. Everywhere else in these films a house is a
thing that can be owned, moved, counted, financed and sold. In a papakāinga
frame the house is the one element that is *not* the subject.

### Two marks that did not survive, and why

- **An open sightline** leaving the frame toward something unnamed, to carry
  orientation to a tohu. Rejected. Every source for it is a *named* hapū
  orienting to a *named* landmark on their own whenua, so a generic version
  invents a tikanga rather than following one. It also breaks the edge rule: an
  unlabelled line crossing the title boundary is exactly the mark that means
  "a separate title now exists".
- **A held-open middle**, the shared centre with nothing standing in it.
  Rejected on sourcing. Its authority was the NES-P definition D12 — which
  defines a **marae complex** ("the complex of buildings around the open area in
  front of a wharenui"), not a papakāinga. Borrowing a marae definition for
  papakāinga is a motif reinvented by another route.

### What Te Aranga can and cannot do for us

The **Te Aranga Māori Design Principles** (Ngā Aho, 2008; published via the
Auckland Design Manual) are the one framework published so that non-iwi
designers can engage — seven outcomes: Mana, Whakapapa, Taiao, Mauri Tū, Mahi
Toi, Tohu, Ahi Kā. Three things follow:

1. Their use is expressly "predicated on the development of high quality durable
   relationships" with iwi/hapū, and **Mana is named as the catalyst that
   activates the other six**. So we may read, cite and learn from Te Aranga — we
   cannot claim to *apply* it without that relationship.
2. **Mahi Toi is itself the rule against borrowed motif**: it requires that
   iwi/hapū *mandated* artists do the narrative work. A publisher drawing its own
   "Māori motif" is outside the framework, not applying it.
3. It is a **Tāmaki Makaurau** instrument, and the Mana Whenua Kaitiaki Forum has
   notified Auckland Council that it intends to develop Tāmaki-specific
   principles that will replace it there.

### The warning worth heeding

A full build-up of this vocabulary in the Greens frame was costed at roughly
**seven times** the treatment the other two slots get — nine seconds alone, eight
drawn elements against the developers' two houses — and it would stage the
construction *under the Greens' funding line*, which is the policy visibly
working. That reverses the asymmetry instead of fixing it.

So: **the reframe is right, the expansion is wrong.** Papakāinga keeps one slot
of equal weight. What changes is the glyph — ground rather than house — not the
airtime.

---

## Provenance

Grounded against: Te Ture Whenua Māori Act 1993 (ss 4, 129, 147A, 148, 152,
338); Heritage New Zealand Pouhere Taonga Act 2014 (s 6, s 42); Resource
Management Act 1991 (ss 6(e), 7(a), 8); Marine and Coastal Area (Takutai Moana)
Act 2011 (ss 58, 78–79); the National Environmental Standards for Papakāinga
(in force 2 July 2026) and their Regulatory Impact Statement; Māori Land Court,
*Māori Land Update*, June 2025; Te Aka Māori Dictionary; IPONZ Trade Marks
Practice Guideline 16; Te Mana Raraunga Māori data sovereignty principles;
Wai 262; and ACT's own published position of 3 October 2026.

Claims about tikanga in this document are limited to what is traceable to a
citable source. Where the right answer is "ask", the document says so rather
than guessing. Statements about Te Puni Kōkiri's papakāinga funding threshold
and about MfE's consultation wording came from the review and are worth
confirming directly before either is relied on in a frame.
