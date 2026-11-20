/** The Inboxed mark: an envelope with a postmark ring. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="var(--teal)" />
      <rect x="4" y="7" width="13" height="10" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="M4.6 7.8l5.9 4.6 5.9-4.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="18" cy="7" r="3.2" fill="var(--teal)" stroke="#fff" strokeWidth="1.4" />
    </svg>
  );
}
