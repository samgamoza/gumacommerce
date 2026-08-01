import { useId } from "react";

interface GumaMarkProps {
  className?: string;
  title?: string;
}

/**
 * Guma One brand mark: a chat bubble fused with a shopping bag —
 * bag handle on top, chat tail below, typing dots inside. "Chats become orders."
 */
export function GumaMark({ className, title = "Guma One" }: GumaMarkProps) {
  const id = useId();
  const tileId = `${id}-tile`;
  const shineId = `${id}-shine`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient
          id={tileId}
          x1="8"
          y1="4"
          x2="58"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#10B981" />
          <stop offset="0.55" stopColor="#059669" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <radialGradient
          id={shineId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(18 10) rotate(55) scale(46)"
        >
          <stop stopColor="white" stopOpacity="0.28" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tile */}
      <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${tileId})`} />
      <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${shineId})`} />

      {/* Bag handle */}
      <path
        d="M23.5 26v-3.5a8.5 8.5 0 0 1 17 0V26"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Bubble-bag body with chat tail */}
      <path
        d="M24 24.5h16a7 7 0 0 1 7 7V41a7 7 0 0 1-7 7H30l-6.8 5.1c-1.5 1.13-3.6-.17-3.2-2l.83-3.74A7 7 0 0 1 17 41v-9.5a7 7 0 0 1 7-7Z"
        fill="white"
      />

      {/* Typing dots */}
      <circle cx="25.5" cy="36.5" r="2.6" fill="#047857" />
      <circle cx="32" cy="36.5" r="2.6" fill="#F59E0B" />
      <circle cx="38.5" cy="36.5" r="2.6" fill="#047857" />

      {/* Tap spark */}
      <path
        d="M50.5 5.5l1.9 4.3 4.3 1.9-4.3 1.9-1.9 4.3-1.9-4.3-4.3-1.9 4.3-1.9 1.9-4.3Z"
        fill="#FBBF24"
      />
    </svg>
  );
}
