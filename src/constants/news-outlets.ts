/**
 * The outlets the news feed reads, as plain data.
 *
 * It lived in components/news/about-news.tsx, which carries 'use client'. A
 * SERVER component importing a value from a client module does not get the
 * value: Next replaces the module's exports with client references, so
 * `OUTLET_NAMES.slice(...)` threw "slice is not a function" at prerender and
 * took the whole build down with it. The symptom names a method, which sends
 * you looking at the data; the cause is which side of the boundary the data is
 * declared on.
 *
 * A constants module has no directive, so both sides get the real array.
 */
export const OUTLET_NAMES = ['RNZ', 'the Beehive', 'NZ Herald', 'Stuff', 'Newsroom'] as const
