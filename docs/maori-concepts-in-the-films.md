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
| 0 · papakāinga | **one** house, scale 0.84 | *none* |
| 1 · developers | **two** houses, scale 0.70 | "some affordable" |
| 2 · committees | **two** figures, scale 0.84 | "renters too" |

Papakāinga is the only slot that gets a single glyph and no qualifier. And it is
the *same* `house()` glyph used for private-developer stock, whose settled
meaning in this series is a separately ownable dwelling — which is the one thing
a papakāinga dwelling is not. Te Aka's sense of papa kāinga is "original home,
home base, village, communal Māori land"; one house is below the floor of every
source available.

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
