/**
 * video-tagging.mjs — the term lists and matchers used to tag a YouTube clip.
 *
 * Extracted from ingest-videos.mjs so that re-tagging already-staged rows
 * (retag-pending-videos.mjs) cannot drift from what the ingest itself does.
 * Two copies of this logic would disagree within a week, and the disagreement
 * would show up as tags that change every time a script is run.
 *
 * Electorate, candidate, bill and party terms live in their own modules and are
 * shared with the news ingest; only the video-specific vocabulary is here.
 */

// ── Matching ─────────────────────────────────────────────────────────────────
// Anchored to the START of a word, not a bare substring. Bare `includes` is how
// 'rma' tagged "information" and how 'poll' tags "pollution". The terms below
// are deliberately stems ('econom', 'sentenc', 'educat'), so the END is left
// open on purpose — only the start is anchored.
const termRe = new Map()

export function hasTerm(t, term) {
  const key = String(term).trim()
  if (!key) return false
  let re = termRe.get(key)
  if (!re) {
    re = new RegExp('(^|[^a-z0-9])' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    termRe.set(key, re)
  }
  return re.test(t)
}

export const anyTerm = (terms, t) => terms.some((x) => hasTerm(t, x))
export const tag = (map, t) => Object.keys(map).filter((k) => anyTerm(map[k], t))

// ── Vocabulary ───────────────────────────────────────────────────────────────
export const TOPIC_TERMS = {
  economy: ['econom', 'tax', 'budget', 'inflation', 'cost of living', 'wages'],
  housing: ['housing', 'rent', 'tenan', 'homeless'],
  health: ['health', 'hospital', 'pharmac', 'doctor'],
  education: ['school', 'educat', 'teacher', 'ncea'],
  // NOT bare 'rma' — it is a substring of "information", "transformation",
  // "performance" and "format", so it tagged 75% of all climate items on text
  // with no climate content in it whatsoever.
  climate: ['climate', 'emissions', 'environment', 'resource management', 'rma reform', 'rma', 'conservation'],
  'crime-justice': ['crime', 'police', 'gang', 'court', 'sentenc', 'justice'],
}

// NOT '2026'. In 2026 every dated upload carries it, so "MetService morning
// weather update: August 19, 2026" counted as election-relevant — and that flag
// paints a public "ELECTION" badge on the card, so it was wrong on the live
// site, not merely noisy in review.
export const ELECTION_TERMS = ['election', 'campaign', 'candidate', 'poll', 'voter', 'coalition', 'debate', 'leader']

// No bare 'debate' — "bitter medical debate" is not a leaders' debate. Only
// phrases that specifically mean an election debate / leader interview.
export const DEBATE_TERMS = ['leaders debate', "leaders' debate", 'leaders’ debate', 'election debate', 'the great debate', 'head to head', 'head-to-head', 'q+a', 'q&a', 'minor party', 'leaders interview', 'leader interview', 'young voters debate', 'finance debate']

export const PRESS_TERMS = ['press conference', 'media conference', 'post-cabinet', 'standup', 'stand-up', 'press standup', 'state of the nation', 'campaign launch', 'speech to', 'address to']
export const LEADER_NAMES = ['luxon', 'hipkins', 'swarbrick', 'marama davidson', 'seymour', 'winston peters', 'waititi', 'ngarewa-packer', 'qiulae wong']

// Obvious non-political categories dropped from political channels
// (Parliament/RNZ) — only when the clip also mentions no party, no election
// term and no policy topic.
export const VIDEO_NOISE_TERMS = ['gardener', 'once were', 'matariki', 'trailer', 'weather', 'forecast', 'recipe', 'all blacks', 'super rugby', 'silver ferns', 'black caps', 'good as gold', 'episode']

export const INTERVIEW_TERMS = [
  'interview', 'in conversation', 'sits down with', 'sat down with', 'one on one',
  'one-on-one', 'full interview', 'exclusive interview', 'speaks to', 'speaks with',
  'talks to', 'in the studio', 'at large with', 'on the record', 'long read',
]

export const isPresser = (t) => anyTerm(PRESS_TERMS, t) || anyTerm(LEADER_NAMES, t)
export const isInterview = (t) => anyTerm(INTERVIEW_TERMS, t)
