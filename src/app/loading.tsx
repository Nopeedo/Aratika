import { PageSkeleton } from '@/components/ui/page-skeleton'

// The fallback for every route that hasn't got a loading file of its own,
// including the homepage, which renders per request because of its signed-in
// redirect. A segment with its own loading.tsx still wins over this one.
export default function Loading() { return <PageSkeleton lines={3} cards={3} /> }
