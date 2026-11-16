import { OrbitMark } from "@orbit/ui/components/brand/OrbitLoader";

/** Renders inside the auth card while the next auth page loads. */
export default function Loading() {
  return (
    <div role="status" className="flex flex-col items-center py-14 text-center">
      <OrbitMark size={72} />
      <p className="mt-6 font-semibold">Loading</p>
      <p className="mt-1 text-sm text-text-muted">Getting everything ready for you.</p>
    </div>
  );
}
