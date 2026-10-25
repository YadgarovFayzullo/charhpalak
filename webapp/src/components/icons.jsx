const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true }

export const Home = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 11 12 4l9 7v9H3z" /></svg>
)

export const Search = ({ size = 22, strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={strokeWidth} strokeLinecap="round">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
)

export const Players = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="9" cy="8" r="3.5" /><path d="M3 20c.8-3.5 3.2-5 6-5s5.2 1.5 6 5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3 2 3.5 5" />
  </svg>
)

export const Partners = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c.8-3.5 3.2-5 6-5s5.2 1.5 6 5M15 15c3 0 5 1.5 6 5" />
  </svg>
)

export const Trophy = ({ size = 22, full = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d={full ? 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8' : 'M7 4h10v5a5 5 0 0 1-10 0zM12 14v4M8 21h8'} />
  </svg>
)

export const User = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
)

export const Calendar = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
)

export const Star = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8l5.5-.8z" /></svg>
)

export const Filter = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
)

export const Check = ({ size = 26, color = '#0F1F14' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const Telegram = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
    <path d="M21.5 4.5 2.8 11.7c-1 .4-1 1.6 0 1.9l4.7 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.9 3.6c.7.5 1.6.1 1.8-.7l3-15.1c.2-1.1-.8-1.9-1.9-1.4zM9.6 14.6l8.6-7.6-10.2 6.5" />
  </svg>
)
