import { Skeleton } from "@/components/ui/skeleton";

/** Props for {@link StudioSkeleton}. */
export type StudioSkeletonProps = {
  /** Announced to screen readers while the studio loads. */
  label: string;
};

/**
 * Placeholder of the studio frame, shaped like the shell so the swap to content causes no
 * layout shift. Used while a route streams and while `/` picks the workspace to open.
 */
export function StudioSkeleton({ label }: StudioSkeletonProps) {
  return (
    <div role="status" aria-label={label} className="flex h-dvh flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-surface px-3">
        <Skeleton className="size-5 rounded-md" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-12 flex-col items-center gap-3 border-r bg-surface py-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="size-6 rounded-md" />
          ))}
        </div>
        <div className="flex w-70 flex-col gap-3 border-r bg-surface p-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex-1" />
      </div>
      <div className="h-6 border-t bg-surface" />
    </div>
  );
}
