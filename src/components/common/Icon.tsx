export default function Icon({ kind }: { kind: 'scissors' | 'grid' | 'arrow' }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'scissors' ? <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="m8.2 8.2 12.8 11.8M8.2 15.8 21 4M14 12l-3 3" /></> : kind === 'grid' ? <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></> : <path d="M5 12h14m-5-5 5 5-5 5" />}
  </svg>
}

