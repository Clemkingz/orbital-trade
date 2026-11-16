import { Skeleton } from "@orbit/ui/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
      </div>
      <Skeleton className="mt-5 h-80" />
    </div>
  );
}
