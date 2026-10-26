// Stroke icons (24×24 grid, currentColor).
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const I = (paths) => function Icon({ size = 20, ...rest }) {
  return <svg {...base} width={size} height={size} {...rest}>{paths}</svg>
}

export const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="12" fill="none" stroke="#9BD32A" strokeWidth="4" strokeDasharray="14 4.85" />
    <circle cx="16" cy="16" r="4" fill="#9BD32A" />
  </svg>
)

export const Arrow = I(<path d="M5 12h14M13 6l6 6-6 6" />)
export const Plus = I(<path d="M12 5v14M5 12h14" />)
export const Search = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)
export const Pin = I(<><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>)
export const Calendar = I(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>)
export const Globe = I(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>)
export const Check = I(<path d="m5 12.5 4.5 4.5L19 7.5" />)
export const ChevronLeft = I(<path d="m15 6-6 6 6 6" />)
export const ChevronRight = I(<path d="m9 6 6 6-6 6" />)
export const Pause = I(<path d="M8 5v14M16 5v14" strokeWidth="2.6" />)
export const Play = I(<path d="M7 5v14l12-7z" fill="currentColor" />)
export const Chevron = I(<path d="m6 9 6 6 6-6" />)
export const Heart = I(<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />)
export const User = I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>)
export const Users = I(<><circle cx="9" cy="8" r="3.5" /><path d="M3 20c.8-3.5 3.2-5 6-5s5.2 1.5 6 5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3 2 3.5 5" /></>)
export const Trophy = I(<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8" />)
export const Bars = I(<path d="M5 20v-6M10 20V9M15 20v-9M20 20V4" />)
export const Shield = I(<><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>)
export const Image = I(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>)
export const Grid = I(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>)
export const Crown = I(<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z" />)
export const Gift = I(<><rect x="3" y="8" width="18" height="5" rx="1" /><path d="M5 13v8h14v-8M12 8v13M12 8S10.5 3 8 4s-.5 4 4 4M12 8s1.5-5 4-4 .5 4-4 4" /></>)
export const Team = I(<><circle cx="12" cy="7" r="3" /><circle cx="5" cy="10" r="2.2" /><circle cx="19" cy="10" r="2.2" /><path d="M7 20c0-3 2.2-5 5-5s5 2 5 5M1.5 19c.3-2.3 1.7-3.6 3.5-3.6M22.5 19c-.3-2.3-1.7-3.6-3.5-3.6" /></>)

// Sport icons for the filter chips
export const SPORT_ICONS = {
  all: Grid,
  futbol: I(<><circle cx="12" cy="12" r="9" /><path d="m12 7 4 3-1.5 5h-5L8 10z" /><path d="M12 3v4M21 10.5l-5 .5M17.5 19l-3-4M6.5 19l3-4M3 10.5l5 .5" /></>),
  tennis: I(<><circle cx="12" cy="12" r="9" /><path d="M5.5 5.5c3.5 3 3.5 10 0 13M18.5 5.5c-3.5 3-3.5 10 0 13" /></>),
  shaxmat: I(<path d="M8 21h8M9 18h6l-1-6h-4zM9.5 12 8 9l2-1-1-3h6l-1 3 2 1-1.5 3" />),
  yugurish: I(<><circle cx="14" cy="4.5" r="2" /><path d="m6 21 3-6 3 2v5M8 11l3-4 3 1 2 3 3 1M11 7l-1 5 3 2" /></>),
  suzish: I(<><circle cx="16" cy="6" r="2" /><path d="M2 17c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0M4 13l5-4 4 3 3-2" /></>),
  bilyard: I(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="11" r="3.5" /><path d="M12 9.6v2.8" /></>),
  boshqa: I(<><circle cx="6" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18" cy="12" r="1.2" /></>),
}
