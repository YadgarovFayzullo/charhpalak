import { NavLink } from 'react-router-dom'
import { Home, Search, Players, Trophy, User } from './icons.jsx'
import { TOURNAMENT } from '../data.js'

const TABS = [
  { to: '/', label: 'Bosh', Icon: Home, end: true },
  { to: '/search', label: 'Joylar', Icon: Search },
  { to: '/games', label: 'O‘yinlar', Icon: Players },
  { to: `/tournament/${TOURNAMENT.id}`, label: 'Turnirlar', Icon: Trophy },
  { to: '/profile', label: 'Profil', Icon: User },
]

export default function TabBar() {
  return (
    <nav className="tabs" aria-label="Pastki menyu">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
          <Icon />{label}
        </NavLink>
      ))}
    </nav>
  )
}
