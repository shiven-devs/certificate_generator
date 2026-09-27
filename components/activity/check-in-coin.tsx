"use client";

export function CheckInCoin({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="30" fill="#F5B942" />
      <circle cx="32" cy="32" r="24" fill="#F7D36A" stroke="#D4921A" strokeWidth="2" />
      <path
        d="M32 18c-6.2 0-10 3.4-10 8.2 0 3.4 2.2 5.6 7.2 7.1l2.4.7c3.2.9 4.4 1.7 4.4 3.4 0 2.1-1.9 3.5-5 3.5-2.6 0-4.7-.9-6.2-2.3l-2.6 3.4C24.4 44.8 27.6 46 32 46c6.5 0 10.6-3.5 10.6-8.6 0-3.6-2.3-5.8-7.4-7.3l-2.4-.7c-2.9-.8-4.1-1.7-4.1-3.2 0-1.9 1.8-3.2 4.5-3.2 2.3 0 4.2.7 5.6 1.9l2.4-3.4C39.2 19.3 36.1 18 32 18Z"
        fill="#C98412"
      />
    </svg>
  );
}
