import { Suspense } from "react";
import { TrackView } from "@/components/kart/track-view";

export const metadata = { title: "Track order · Guma Kart" };

export default function TrackPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <TrackView />
      </Suspense>
    </main>
  );
}
