"use client";

import { useEffect, useState } from "react";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function secondsUntilMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

export function useDealCountdown(): string {
  const [seconds, setSeconds] = useState(secondsUntilMidnight);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds(secondsUntilMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
