"use client";

import { useEffect, useState } from "react";

export function useHasCamera(): "checking" | "yes" | "no" {
  const [state, setState] = useState<"checking" | "yes" | "no">("checking");

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
        if (!cancelled) setState("no");
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some((device) => device.kind === "videoinput");
        if (!cancelled) setState(hasVideo ? "yes" : "no");
      } catch {
        if (!cancelled) setState("no");
      }
    }

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useIsMobileViewport(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return mobile;
}
