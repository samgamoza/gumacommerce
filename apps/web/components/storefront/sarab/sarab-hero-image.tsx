"use client";

import { useState } from "react";

/**
 * Hero circle image with fallback chain so a broken newest-product upload
 * does not leave an empty peach glow.
 */
export function SarabHeroImage({
  sources,
  alt,
}: {
  sources: string[];
  alt: string;
}) {
  const list = sources.filter(Boolean);
  const [index, setIndex] = useState(0);
  const src = list[Math.min(index, Math.max(list.length - 1, 0))];

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => {
        if (index < list.length - 1) setIndex((i) => i + 1);
      }}
    />
  );
}
