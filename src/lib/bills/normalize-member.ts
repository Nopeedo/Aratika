/**
 * Pure, dependency-free name normaliser shared by the bills tracker (client) and
 * the server-side member→party map. Kept in its own module so the client bundle
 * can use it without pulling in the large MP dataset.
 *
 * Bill "member" strings are surname-first with an embedded honorific
 * ("Willis, Hon Nicola"); MP profile names are "Firstname Surname". We normalise
 * both to an order-independent key: drop honorifics, sort the remaining tokens.
 */

const NAME_TITLES = new Set(['rt', 'hon', 'dr', 'sir', 'dame', 'the'])

export const normMemberName = (s: string): string =>
  s
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t && !NAME_TITLES.has(t))
    .sort()
    .join('')
