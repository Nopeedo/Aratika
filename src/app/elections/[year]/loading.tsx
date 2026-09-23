import { PageSkeleton } from '@/components/ui/page-skeleton'

// This route measured ~1.4s to first byte in production.
// Without a loading file the App Router leaves the PREVIOUS page on screen for
// that whole time, so the route-progress bar is the only thing moving and a
// click reads as having missed.
export default function Loading() { return <PageSkeleton lines={3} cards={3} /> }
