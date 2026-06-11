// ─── Party ────────────────────────────────────────────────────────────────────

export type PartySlug =
  | 'national'
  | 'labour'
  | 'act'
  | 'green'
  | 'nzfirst'
  | 'tpm'
  | 'independent'

export interface Party {
  id: string
  name: string
  slug: PartySlug
  fullName: string
  leader: string
  leaderSlug: string
  color: string
  textColor: string
  seats: number
  founded?: string
  ideology: string[]
  website?: string
  parliament: Parliament
  status: 'governing' | 'opposition' | 'support'
}

// ─── Parliament ────────────────────────────────────────────────────────────────

export type Parliament = '54th' | '53rd'

export interface ParliamentSession {
  number: Parliament
  startDate: string
  endDate?: string
  governingParties: PartySlug[]
  pm: string
  pmSlug: string
  status: 'current' | 'previous'
  totalSeats: number
}

// ─── MP ───────────────────────────────────────────────────────────────────────

export type MPStatus = 'active' | 'inactive' | 'former'
export type MPRole = 'list' | 'electorate'

export interface MP {
  id: string
  name: string
  slug: string
  photo?: string
  party: PartySlug
  role: MPRole
  electorate?: string          // Only for electorate MPs
  portfolios: string[]         // Ministerial portfolios held
  status: MPStatus
  parliament: Parliament
  email?: string
  website?: string
  socialMedia?: {
    twitter?: string
    facebook?: string
    instagram?: string
  }
  committees: string[]
  declaredInterests?: string[]
  joinedDate?: string
}

export interface MPVoteRecord {
  mpSlug: string
  billId: string
  billTitle: string
  vote: 'aye' | 'noe' | 'abstain' | 'absent'
  date: string
}

// ─── Bills ────────────────────────────────────────────────────────────────────

export type BillStatus =
  | 'introduced'
  | 'first-reading'
  | 'select-committee'
  | 'second-reading'
  | 'committee-of-whole-house'
  | 'third-reading'
  | 'royal-assent'
  | 'defeated'

export type BillType = 'government' | 'members' | 'private' | 'local'

export interface Bill {
  id: string
  title: string
  slug: string
  number: string
  type: BillType
  status: BillStatus
  sponsoredBySlug: string
  sponsoringParty: PartySlug
  introducedDate: string
  lastActivity: string
  summary: string
  parliament: Parliament
  votes?: BillVote[]
  url?: string                 // Link to parliament.nz
}

export interface BillVote {
  date: string
  stage: string
  result: 'passed' | 'defeated'
  ayes: number
  noes: number
  partyVotes: PartyVoteBreakdown[]
}

export interface PartyVoteBreakdown {
  party: PartySlug
  vote: 'aye' | 'noe' | 'split' | 'absent'
  count: number
}

// ─── Policies ────────────────────────────────────────────────────────────────

export type PolicyTopic =
  | 'housing'
  | 'health'
  | 'economy'
  | 'environment'
  | 'education'
  | 'crime-justice'
  | 'foreign-policy'
  | 'treaty-maori-affairs'
  | 'climate'
  | 'immigration'

export interface Policy {
  id: string
  party: PartySlug
  topic: PolicyTopic
  title: string
  summary: string
  impact: string               // How this affects everyday NZers
  sourceUrl: string
  lastUpdated: string
}

// ─── Electorate / Map ────────────────────────────────────────────────────────

export type ElectorateType = 'general' | 'maori'

export interface Electorate {
  id: string
  name: string
  slug: string
  type: ElectorateType
  region: string
  currentMPSlug: string
  party: PartySlug
  majority?: number
}

// ─── Elections ───────────────────────────────────────────────────────────────

export interface Election {
  year: number
  date: string
  parliament: Parliament
  results: ElectionPartyResult[]
  voterTurnout: number
  totalValidVotes: number
}

export interface ElectionPartyResult {
  party: PartySlug
  partyVotePercentage: number
  partyVotes: number
  electorateSeats: number
  listSeats: number
  totalSeats: number
  seatChange: number           // Change from previous election
}

// ─── User / Auth ─────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus?: SubscriptionStatus
  createdAt: string
}

export type BookmarkType = 'mp' | 'bill' | 'policy' | 'party'

export interface UserBookmark {
  id: string
  userId: string
  type: BookmarkType
  targetSlug: string
  isFavourite: boolean
  createdAt: string
}

// ─── News ────────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string
  title: string
  summary: string
  url: string
  source: string
  sourceUrl: string
  publishedAt: string
  category?: string
  imageUrl?: string
}

// ─── Polls ───────────────────────────────────────────────────────────────────

export interface Poll {
  id: string
  question: string
  topic: PolicyTopic | 'general'
  options: PollOption[]
  totalVotes: number
  status: 'active' | 'closed'
  startsAt: string
  endsAt?: string
}

export interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

export interface UserPollVote {
  pollId: string
  optionId: string
  userId?: string
  votedAt: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardActivity {
  id: string
  type: 'vote' | 'bill' | 'speech' | 'portfolio-change' | 'news'
  mpSlug?: string
  partySlug?: PartySlug
  title: string
  description: string
  date: string
  url?: string
}
