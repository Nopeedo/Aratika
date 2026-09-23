import { PageSkeleton } from '@/components/ui/page-skeleton'

// The full MP directory: 123 profiles assembled per request.
// Without a loading file the App Router leaves the PREVIOUS page on screen for
// that whole time, so the route-progress bar is the only thing moving and a
// click reads as having missed.
export default function Loading() { return <PageSkeleton lines={2} cards={6} /> }
