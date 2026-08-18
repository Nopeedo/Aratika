import { PageSkeleton } from '@/components/ui/page-skeleton'

// This route measured between 1.2s and 2.3s to first byte in production.
// Without a loading file the App Router leaves the PREVIOUS page on screen
// for that whole time, which is what made clicks look like they had missed.
export default function Loading() { return <PageSkeleton lines={2} cards={4} /> }
