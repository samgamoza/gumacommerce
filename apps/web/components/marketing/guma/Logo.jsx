'use client';
const LOGO_URL = 'https://media.base44.com/images/public/6a5c7e593139789db76293a9/777f7ffd4_gumaone_logo_white.png';

export default function Logo({ className = 'text-2xl' }) {
  return (
    <img
      src={LOGO_URL}
      alt="Guma One.Ai"
      className={className}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}