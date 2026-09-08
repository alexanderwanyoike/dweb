import type { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  overview: <path d="m3 10 9-7 9 7v10H15v-6H9v6H3Z" />,
  identity: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 6 0 0 1 16 0v2" />
    </>
  ),
  apps: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <path d="M8 3v6M16 9v6M10 15v6" />
    </>
  ),
  advanced: (
    <>
      <path d="m5 6 6 6-6 6M13 18h6" />
    </>
  ),
};

export function NavigationIcon({ name }: { name: string }) {
  return (
    <svg
      className="navigation-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
