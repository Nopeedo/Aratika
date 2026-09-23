import { PageSkeleton } from '@/components/ui/page-skeleton'

// This route measured 2.1-2.9s to first byte in production, the slowest on the site.
// Without a loading file the App Router leaves the PREVIOUS page on screen for
// that whole time, so the route-progress bar is the only thing moving and a
// click reads as having missed.
export default function Loading() { return <PageSkeleton lines={2} cards={4} /> }
