/**
 * ingest-videos.mjs — the video feed: "Leaders & the press" from official
 * channels (Parliament, RNZ, each party) plus the interview tier (see CHANNELS).
 * Uploads are read through lib/youtube.mjs, which uses the YouTube Data API when
 * YOUTUBE_API_KEY is set and otherwise falls back to channel RSS. We store the videoId + title +
 * thumbnail and EMBED via the privacy-enhanced player; we never host/rebroadcast.
 *
 * Party channels' videos are tagged to that party; Parliament/RNZ videos are
 * tagged by who they mention. Unlike the news feed, videos are ingested as
 * status='pending' — they are partisan campaign content, so an editor must
 * approve (and can fix topic tags) via /editor before they go public.
 * content_items type='video'.
 *
 * Run: node scripts/ingest-videos.mjs   (--reset to clear existing videos first)
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PARTY_TERMS, isPolitical, tagMPs } from './political-terms.mjs'
import { buildElectorateTerms, addCandidateTerms } from './electorate-terms.mjs'
import { buildCandidateTerms, tagCandidates } from './candidate-terms.mjs'
import { buildBillTerms, tagBills } from './bill-terms.mjs'
import { getUploads, getDurations, hasApiKey, announceMode } from './lib/youtube.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
// How far back to read per channel.
//
// This was 6, which quietly produced a monoculture. Every outlet covers the same
// dominant story at once, so during the August 2026 National leadership crisis
// the newest six uploads on nearly every channel were about Luxon — the first
// interview-tier run staged 19 National items against 2 Green, and neither Green
// item was actually a Green interview.
//
// RSS caps at 15 regardless of what we ask for. With a Data API key the full
// upload history is reachable, which is what lets an interview podcast
// contribute at all: Dave Letele's Chlöe Swarbrick episode is ~30 episodes back
// and is simply absent from the feed.
//
// Deduplication is on the video link, so re-reading entries is free; a wider
// window only costs a slightly longer first run.
// Depth is per channel KIND, not global. A flat 60 pulled 371 videos in one
// run — 45 each from the National, Green and Te Pāti Māori channels — which is
// not coverage, it is a review queue nobody will get through. Party and official
// channels post constantly and only their recent output matters; the interview
// tier is where depth actually buys something, because that is where a
// three-month-old leader interview is still worth surfacing.
const depthFor = (ch) => {
  if (!hasApiKey()) return 15              // RSS caps here regardless
  return ch.interviewsOnly ? 60 : 20
}

// Anything shorter than this is a clip, not an interview, and is skipped for
// interview-tier channels. Three minutes is deliberately generous: a genuinely
// short news interview should survive, a 45-second promo cut should not.
const MIN_INTERVIEW_SECONDS = 180

// Nothing older than this is ingested at all. src/lib/news/videos.ts already
// refuses to DISPLAY anything over two years old, so without a floor here we
// would stage months of stale campaign material purely for a human to reject.
const MAX_AGE_DAYS = 180

// Official channels (resolved + RSS-verified). party=null → tag by who's mentioned.
const CHANNELS = [
  { id: 'UC2N5fRXq0RjHIBofCqslsQA', source: 'NZ Parliament', party: null },
  { id: 'UCp4OXwfZE1SaCQ4jRAuaoXQ', source: 'RNZ', party: null },
  { id: 'UCWdJ3BxqWopIdJ7J_BNu1zQ', source: 'National Party', party: 'national' },
  { id: 'UCiz_HNe4CVNzP-yeYoFydQw', source: 'Labour Party', party: 'labour' },
  { id: 'UCHMJ7z-9wxGvWVljzfntFVQ', source: 'Green Party', party: 'green' },
  { id: 'UCckaX40msHD_vg6iDupfIHA', source: 'ACT', party: 'act' },
  { id: 'UC8PPX2ej6D_77czqEJp46dA', source: 'NZ First', party: 'nzfirst' },
  { id: 'UCRdKSAr6go-3bTSJUZMoXGg', source: 'Te Pāti Māori', party: 'tpm' },
  { id: 'UCkV9-rENFpIihiBnePk5imA', source: 'The Opportunity Party', party: 'top' },
  // Registered extra-parliamentary parties. ID verified from the channel's own
  // externalId (linked from animaljustice.org.nz). Of the six registered minor
  // parties the site covers, this is the only one with a discoverable YouTube
  // channel — ALCP's site blocks fetching, NZ Outdoors' site did not resolve, and
  // Conservative / Vision NZ / Women's Rights link no channel. Add the others here
  // ONLY with an externalId-verified ID: a guessed ID would attribute another
  // entity's videos to a party.
  { id: 'UCYUv8NyJLUeEGWdRJKk-1Jg', source: 'Animal Justice Party', party: 'animal-justice' },
  // ── Broadcaster channels that host the leaders'/minor-party DEBATES ──────────
  // IDs verified from each channel's own "externalId" in ytInitialData
  // (@1NewsNZ / @ThreeNowNZ / @nzheraldtv). party=null → tagged by who's
  // mentioned; debate videos are auto-flagged (DEBATE_TERMS) and reviewed in
  // /editor before going public.
  // debatesOnly: general broadcasters — we only want their debate/leader-interview
  // clips, not their weather/sport/general-news feed.
  // This is general 1News, NOT Q+A — the label claimed Q+A for years while the
  // feed served the main bulletin (latest at time of writing: "ASB Good as Gold:
  // the Naenae Knitters"), so the debatesOnly gate correctly dropped nearly
  // everything and Q+A itself was never ingested at all. Q+A has its own channel;
  // it is in the interview tier below. Found by discover-yt-channels.mjs, which
  // surfaced Q+A as the single broadest source of leader interviews we did not have.
  { id: 'UCxPAYgO8OpFev3PUTKbsxNw', source: '1News', party: null, debatesOnly: true },
  { id: 'UCBTMdHIU_I0KLPDmWCqTbYg', source: 'ThreeNews', party: null, debatesOnly: true },
  { id: 'UCG0xyRVgb5Yf1lvQxkRrYYQ', source: 'NZ Herald — Herald NOW / Ryan Bridge', party: null, debatesOnly: true },

  // ── Independent tier ────────────────────────────────────────────────────────
  // Leaders and candidates give substantial interviews well outside the
  // broadcasters above, and those interviews are often where someone actually
  // explains themselves at length. Admitted on the objective test described
  // near INTERVIEW_TERMS, not on editorial sympathy — the set below deliberately
  // spans kaupapa Māori, right-leaning and left-leaning independents.
  //
  // Every ID below was resolved with scripts/resolve-yt-channel.mjs from the
  // channel's own externalId, never typed from memory. That is not ceremony:
  // @TheHuiNZ resolves to an abandoned channel whose only upload is from 2013,
  // @TheWorkingGroup resolves to a US anti-hate organisation, and @SpinoffTV is
  // a Portuguese-language channel. Each looked exactly right. Verify or omit.
  //
  // interviewsOnly: these channels also cover culture, sport and general news,
  // so a clip is staged only when it names someone we track AND is political.
  { id: 'UCfH71_VJFvfj-lURA9w4frw', source: 'The Hui', party: null, interviewsOnly: true },
  { id: 'UCm2YVvo3blxPgvu5wAHcm2Q', source: 'Te Ao Māori News', party: null, interviewsOnly: true },
  { id: 'UCYKvkaqOJFwji8-Jgm8pjhA', source: 'The Platform', party: null, interviewsOnly: true },
  { id: 'UCprQWxc91NtC1Jx1iuEbC-Q', source: 'The Spinoff', party: null, interviewsOnly: true },
  { id: 'UCDR2gVFmKy9xRU09ibm5S0A', source: 'Newsroom', party: null, interviewsOnly: true },

  // Found by discover-yt-channels.mjs rather than by anyone remembering them,
  // ranked by how many different leaders each interviews. Every ID re-verified
  // through resolve-yt-channel.mjs and confirmed active within the last week.
  { id: 'UCUmUXLkoEYuMkKmks68wlNw', source: 'Q+A with Jack Tame', party: null, interviewsOnly: true },
  { id: 'UClzBpZhuLm4JgpmPGlDxOyw', source: 'Pacific Media Network', party: null, interviewsOnly: true },
  { id: 'UC4j_V-ezhyyNA1lquf1M4zw', source: 'The Bradbury Group', party: null, interviewsOnly: true },
  { id: 'UCgSIWmLRoSgFklpOr9rVjfg', source: 'Newstalk ZB', party: null, interviewsOnly: true },
  { id: 'UCZgnsVbXJPZRg5kmtKyq6Ew', source: 'Stuff', party: null, interviewsOnly: true },
  { id: 'UCSypyI8wbnZgJDYY0VCdwJQ', source: 'Duncan Garner — Editor-in-Chief', party: null, interviewsOnly: true },

  // Found on a second discovery pass, after the first list of leaders quietly
  // omitted TOP's. Adding her surfaced a whole layer of outlets that interview
  // the smaller parties — which the big-party saturation had hidden. All three
  // carry long-form Green and TOP interviews the tier otherwise had none of.
  { id: 'UCYwnKdpXjLdEvkhk1p1wU-g', source: 'Unfiltered with Dave Letele', party: null, interviewsOnly: true },
  { id: 'UCs4cTIpx0lHo3gvTyaorqbA', source: 'Chris Lynch Media', party: null, interviewsOnly: true },
  // Reversing an earlier rejection: it was dismissed as "mostly commentary",
  // which is a volume judgement, and the agreed test is not about volume. It
  // does conduct its own interviews (Marama Davidson, Qiulae Wong), so it
  // qualifies. Its commentary will lean on the /editor gate more than most.
  { id: 'UC_vLFXwlByZ8d6JPeOKMVjw', source: 'Big Hairy Network', party: null, interviewsOnly: true },

  // Found by discover-race-channels.mjs, which searches CANDIDATES in the most
  // marginal seats rather than leaders. Neither of these would ever surface from
  // a search for a party leader, and both cover races the national outlets do
  // not touch.
  { id: 'UCtgvSkmjzkGoFMflc_ztVwQ', source: 'Te Karere TVNZ', party: null, interviewsOnly: true },
  // Small, and that is the point: it interviewed the Legalise Cannabis, Green
  // and Labour candidates for Te Tai Tokerau in turn. Interviewing across
  // parties is exactly what the admission test asks for, and audience size is
  // not a criterion — applying one would quietly exclude every local outlet.
  { id: 'UCxMMtCyUYe_yBVY7WrVAYCA', source: 'a Curious Family', party: null, interviewsOnly: true },

  // ── Checked and deliberately NOT added ──────────────────────────────────────
  // Recorded so the same candidates are not re-litigated, and so the reasoning
  // is auditable rather than remembered.
  //
  //   Marae (UCd_uV1LZOdOeTUuehv10-ZA) — resolves and parses, newest upload is
  //     December 2015. Dormant.
  //   The Office of the Mayor of Auckland (UCwwQtm0HmS89e1Y1PMIblcA) — surfaced
  //     for "Winston Peters: Why NZFirst Deserves Your Vote" and a Swarbrick
  //     election pitch. It is a serving politician's office publishing campaign
  //     content, i.e. a political actor, not a media outlet. The interview test
  //     admits outlets that QUESTION politicians, not ones that platform them.
  //   Rewiring Aotearoa (UCy0MdcqxBnloVBwlQCsbqQQ) — its "Political Power"
  //     series does interview leaders, but it is an electrification advocacy
  //     organisation with a direct stake in the policies discussed. Same
  //     objection as the mayor's office, one step removed.
  //   WhangareiTim (UCpaC4vpape5nPWdiXn259XQ) — ranked well on breadth (three
  //     leaders) which is exactly why breadth alone cannot be the test. It
  //     repackages other people's clips under attack framing ("Nicola Willis
  //     Slaughters Green MP Chlöe Swarbrick", "MP Debbie Ngarewa-Packer Should
  //     Be Prosecuted !!!"). It does not interview anyone. Also signed off in
  //     July 2026.
  //   APT (UCpLEtz3H0jSfEneSdf1YKnw) — a wire service reposting a Luxon
  //     livestream. Not an interview outlet.
  //   Chris Baillie (UCQigy6RIqmXGqlzJFSIKC-A) — surfaced by race discovery,
  //     but it is the candidate's OWN channel. Self-publication, same category
  //     as a party channel and the mayor's office: the test admits outlets that
  //     question candidates, not candidates publishing themselves. (Its top hit
  //     was also a 2025 council campaign video, not this election.)
  //
  // Undecided, worth a human call — Engineering New Zealand
  // (UCX11-WjWI7XcDjYYuDt71tg) runs an "Election Conversations" series that
  // interviews small-party leaders the mainstream barely covers (Swarbrick,
  // Qiulae Wong). It questions rather than platforms, which is the right side of
  // the line — but it is a professional body with infrastructure policy
  // interests, which is the wrong side of the Rewiring Aotearoa precedent.
]

// Party + political term lists — generated from the current MP roster
// (scripts/gen-political-terms.mjs). Every current MP is mapped to their party by
// full name, so "…Chris Bishop", "Cushla Tangaere-Manuel" etc. tag correctly.
const TOPIC_TERMS = {
  economy: ['econom', 'tax', 'budget', 'inflation', 'cost of living', 'wages'], housing: ['housing', 'rent', 'tenan', 'homeless'],
  health: ['health', 'hospital', 'pharmac', 'doctor'], education: ['school', 'educat', 'teacher', 'ncea'],
  // NOT bare 'rma' — it is a substring of "information", "transformation",
  // "performance" and "format", so it tagged 75% of all climate items on text
  // with no climate content in it whatsoever.
  climate: ['climate', 'emissions', 'environment', 'resource management', 'rma reform', ' rma ', 'conservation'], 'crime-justice': ['crime', 'police', 'gang', 'court', 'sentenc', 'justice'],
}
const ELECTION_TERMS = ['election', 'campaign', 'candidate', 'poll', 'voter', 'coalition', 'debate', '2026', 'leader']
// Leaders'/minor-party debates and long-form leader interviews — surfaced as a
// dedicated "Debates" rail in the Election Centre. Broadcast by media channels
// (see CHANNELS), reviewed in /editor before showing.
// No bare 'debate' — "bitter medical debate" is not a leaders' debate. Only
// phrases that specifically mean an election debate / leader interview.
const DEBATE_TERMS = ['leaders debate', "leaders' debate", 'leaders’ debate', 'election debate', 'the great debate', 'head to head', 'head-to-head', 'q+a', 'q&a', 'minor party', 'leaders interview', 'leader interview', 'young voters debate', 'finance debate']

// "Leaders & the press" rail: its subtitle promises press standups, leader
// updates AND debates, but only debate-flagged clips ever qualified — so it sat
// nearly empty until debate season (Sep–Oct). The presser flag admits official-
// channel clips that are leader press events or name a party leader.
const PRESS_TERMS = ['press conference', 'media conference', 'post-cabinet', 'standup', 'stand-up', 'press standup', 'state of the nation', 'campaign launch', 'speech to', 'address to']
const LEADER_NAMES = ['luxon', 'hipkins', 'swarbrick', 'marama davidson', 'seymour', 'winston peters', 'waititi', 'ngarewa-packer', 'qiulae wong']
const isPresser = (t) => PRESS_TERMS.some((x) => t.includes(x)) || LEADER_NAMES.some((x) => t.includes(x))
// Obvious non-political categories dropped from political channels (Parliament/RNZ)
// — only when the clip also mentions no party, no election term and no policy topic.
const VIDEO_NOISE_TERMS = ['gardener', 'once were', 'matariki', 'trailer', 'weather', 'forecast', 'recipe', 'all blacks', 'super rugby', 'silver ferns', 'black caps', 'good as gold', 'episode ']
const tag = (map, t) => Object.keys(map).filter((k) => map[k].some((x) => t.includes(x)))
// Feed text is XML-escaped; descriptions carry &amp; &quot; &#39; routinely.
const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#3[49];/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&')

// ── Independent tier ──────────────────────────────────────────────────────────
// Channels that are neither a party's own channel nor a national broadcaster,
// admitted on one objective test: they publish original, on-the-record
// interviews with named leaders or candidates. Leaning is NOT a criterion —
// applying one would mean this site deciding which outlets are legitimate. What
// keeps it honest instead is disclosure and measurement: the outlet is named on
// every card, and report-interview-balance.mjs counts interviews per party so a
// skew in the tier is visible rather than silent.
//
// Everything still lands status='pending' for /editor, so nothing here reaches
// the public without a human seeing it first.
const INTERVIEW_TERMS = [
  'interview', 'in conversation', 'sits down with', 'sat down with', 'one on one',
  'one-on-one', 'full interview', 'exclusive interview', 'speaks to', 'speaks with',
  'talks to', 'in the studio', 'at large with', 'on the record', 'long read',
]
const isInterview = (t) => INTERVIEW_TERMS.some((x) => t.includes(x))

// Shared electorate tagging (all 72 seats + curated battleground judgement +
// announced 2026 challengers) — the same map ingest-news.mjs uses.
const ELECTORATE_TERMS = buildElectorateTerms()
await addCandidateTerms(ELECTORATE_TERMS, sb)
const tagElectorates = (t) => Object.keys(ELECTORATE_TERMS).filter((name) => ELECTORATE_TERMS[name].some((term) => t.includes(term)))

// 2026 candidates by name. Sitting MPs come through tagMPs; this is everyone
// else standing — 233 of the 321 candidate records — who could not be tagged at
// all before, and who the interview gate therefore treated as nobody.
const { terms: CANDIDATE_TERMS } = await buildCandidateTerms(sb)

// Bills, the same curated aliases the news ingest uses. Tracking a bill
// surfaced articles about it but never the interview where a minister defends
// it — an odd gap once Q+A and The Platform were in the tier.
const BILL_TERMS = buildBillTerms()
console.log(`Bill tagging: ${Object.keys(BILL_TERMS).length} bills, ${Object.values(BILL_TERMS).flat().length} terms`)

// --dry-run: fetch, tag and classify as normal, print, write nothing. The whole
// point of a new source tier is what it lets through, and that is invisible once
// the rows are in the table.
const DRY = process.argv.includes('--dry-run')
announceMode()
if (DRY) console.log('DRY RUN — feeds fetched and tagged, nothing written.\n')

const RESET = process.argv.includes('--reset')
if (RESET && DRY) { console.error('--reset with --dry-run would still delete every video. Refusing.'); process.exit(1) }
if (RESET) { const { error } = await sb.from('content_items').delete().eq('type', 'video'); console.log(error ? 'reset err: ' + error.message : 'cleared existing videos') }

// Paginate, same reason as the news ingest: a plain select stops at 1000 rows.
// Video sits at ~920 today so it has not bitten yet, which is exactly why it is
// worth fixing now rather than when the count crosses over unnoticed.
const have = new Set()
for (let from = 0; ; from += 1000) {
  const { data: page } = await sb.from('content_items')
    .select('source_id').eq('type', 'video').order('id').range(from, from + 999)
  for (const r of page || []) have.add(r.source_id)
  if (!page || page.length < 1000) break
}

let staged = 0, shorts = 0, old = 0
const ageFloor = new Date(Date.now() - MAX_AGE_DAYS * 86400000).toISOString()
for (const ch of CHANNELS) {
  // Uploads come from lib/youtube.mjs, which uses the Data API when a key is
  // configured and falls back to RSS otherwise — see PER_CHANNEL above for why
  // the depth matters.
  const uploads = await getUploads(ch.id, depthFor(ch))

  // Drop shorts from the interview tier. "Long-form interview" is the whole
  // admission test for these channels, and reading deeper than RSS surfaces
  // every promo cut alongside the episode it came from — clips that inherit the
  // full episode's description, so they match a leader's name while their own
  // title names nobody. Unknown duration means keep: without an API key there
  // are no durations at all, and this must never quietly drop a real interview.
  let durations = new Map()
  if (ch.interviewsOnly && hasApiKey()) {
    durations = await getDurations(uploads.filter((u) => !u.published || u.published >= ageFloor).map((u) => u.videoId))
  }
  const tooShort = (id) => {
    const s = durations.get(id)
    return s !== undefined && s < MIN_INTERVIEW_SECONDS
  }

  const rows = []
  for (const e of uploads) {
    const vid = e.videoId
    const title = e.title
    const published = e.published
    if (!vid || !title) continue
    const link = `https://www.youtube.com/watch?v=${vid}`
    if (have.has(link)) continue
    have.add(link)
    if (published && published < ageFloor) { old++; continue }
    // Tag on title AND description. Title alone was enough while every channel
    // here was a party or Parliament, where the title names the subject. It is
    // not enough for an interview show: "The Hui Episode 02:11" names nobody, so
    // the clip tagged no party, no MP and no topic, and reached no one tracking
    // any of them.
    const t = (title + ' ' + (e.description || '')).toLowerCase()
    const parties = ch.party ? [ch.party] : tag(PARTY_TERMS, t)
    const topics = tag(TOPIC_TERMS, t)
    const mps = tagMPs(t)
    const electorates = tagElectorates(t)
    const candidates = tagCandidates(t, CANDIDATE_TERMS)
    const bills = tagBills(t, BILL_TERMS)
    const electionRelevant = parties.length > 0 || ELECTION_TERMS.some((x) => t.includes(x))
    const debate = DEBATE_TERMS.some((x) => t.includes(x))
    // Noise gate. Keyword relevance detection is too weak to use as an allowlist
    // (it misses bare party names and minister surnames, e.g. "National promises…",
    // "ACT announces…", "…Chris Bishop"), so we DON'T filter political channels by it.
    // Instead:
    //  • Broadcaster channels are here ONLY for debates → stage a clip only if it's
    //    flagged as a debate. This drops their general weather/sport/Ryan-Bridge feed.
    //  • Political sources (Parliament, RNZ) and party channels stage as before, minus
    //    obvious lifestyle/sport noise via a denylist.
    if (ch.debatesOnly && !debate && !electionRelevant) continue

    // Independent tier: the admission test is "names someone we track, and is
    // political". Both halves are needed. Without the first, Newsroom's
    // documentary on a supplement founder and Te Ao Māori News's school stories
    // flood the review queue. Without the second, any clip mentioning a
    // common surname qualifies. Interview phrasing is recorded but not
    // required — an outlet that leads with "Chlöe Swarbrick on fossil fuels"
    // never says the word "interview", and that is exactly the clip we want.
    // A challenger counts as "someone". Before this, an interview with a
    // first-time candidate was dropped unless it also named a sitting MP —
    // which is precisely backwards during an election campaign.
    const namesSomeone = mps.length > 0 || candidates.length > 0 || LEADER_NAMES.some((x) => t.includes(x))
    if (ch.interviewsOnly && !(namesSomeone && (electionRelevant || isPolitical(t, parties) || topics.length > 0))) continue
    if (ch.interviewsOnly && tooShort(vid)) { shorts++; continue }

    const isNoise = VIDEO_NOISE_TERMS.some((x) => t.includes(x))
    if (isNoise && !debate && !electionRelevant && !isPolitical(t, parties) && topics.length === 0) continue
    rows.push({
      type: 'video', source_id: link, title: title.replace(/&amp;/g, '&'), summary: '', status: 'pending', source_url: link,
      data: {
        videoId: vid, source: ch.source, party: ch.party, parties, topics, mps, electorates,
        candidates, bills,
        pubDate: published, thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        electionRelevant, debate, presser: isPresser(t), featured: false,
        // Drives the Interviews rail. Independent-tier clips all qualify (they
        // only got here by naming someone); elsewhere it needs the phrasing, so
        // a party's own attack ad naming a rival is not filed as an interview.
        interview: ch.interviewsOnly ? true : isInterview(t),
        // "came from the interview tier", nothing more. It was briefly called
        // `independent` and rendered as an IND badge, which became a false claim
        // the moment the tier included Q+A (TVNZ), Newstalk ZB (NZME) and Stuff.
        // The outlet's name is the honest disclosure; a badge asserting
        // independence we cannot define is not.
        interviewTier: !!ch.interviewsOnly,
      },
    })
  }
  if (DRY) {
    for (const r of rows) {
      const d = r.data
      const flags = [d.interview && 'INTERVIEW', d.debate && 'debate', d.presser && 'presser'].filter(Boolean).join(' ')
      console.log(`  · ${r.title.slice(0, 76)}`)
      console.log(`      ${[d.parties.length && `parties:${d.parties.join('/')}`, d.mps.length && `mps:${d.mps.join('/')}`, d.topics.length && `topics:${d.topics.join('/')}`].filter(Boolean).join('  ') || '(no tags)'}${flags ? `   [${flags}]` : ''}`)
    }
  } else if (rows.length) {
    // upsert-ignore so one already-seen link cannot fail the whole channel's
    // batch on the unique (type, source_id) constraint.
    const { error } = await sb.from('content_items')
      .upsert(rows, { onConflict: 'type,source_id', ignoreDuplicates: true })
    if (error) { console.error(`insert err (${ch.source}): ${error.message}`); continue }
  }
  staged += rows.length
  console.log(`✓ ${ch.source}: +${rows.length}${DRY ? ' (dry)' : ''}`)
}
console.log(`\nDone. Staged ${staged} videos${shorts ? `, skipped ${shorts} clip(s) under ${MIN_INTERVIEW_SECONDS}s` : ''}${old ? `, skipped ${old} older than ${MAX_AGE_DAYS} days` : ''}.`)
// Supabase client keeps the event loop alive — exit explicitly so the step ends.
process.exit(0)
