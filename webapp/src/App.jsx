import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { MeProvider, useMe } from './me.jsx'
import { ErrorBox, Loading } from './components/State.jsx'
import Start from './screens/Start.jsx'
import Home from './screens/Home.jsx'
import Search from './screens/Search.jsx'
import Club from './screens/Club.jsx'
import Booking from './screens/Booking.jsx'
import Confirmed from './screens/Confirmed.jsx'
import Games from './screens/Games.jsx'
import NewGame from './screens/NewGame.jsx'
import Tournament from './screens/Tournament.jsx'
import Profile from './screens/Profile.jsx'
import Business from './screens/Business.jsx'
import TournamentApply from './screens/TournamentApply.jsx'
import Applications from './screens/Applications.jsx'

function AppRoutes() {
  const me = useMe()
  const { pathname } = useLocation()

  if (me.error && !me.data) return <ErrorBox error={me.error} onRetry={me.reload} />
  if (!me.data) return <Loading />
  // New users go through onboarding first.
  if (!me.data.onboarded && pathname !== '/start') return <Navigate to="/start" replace />

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/start" element={<Start />} />
      <Route path="/search" element={<Search />} />
      <Route path="/club/:id" element={<Club />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/booking/:id" element={<Confirmed />} />
      <Route path="/games" element={<Games />} />
      <Route path="/games/new" element={<NewGame />} />
      <Route path="/tournament" element={<Tournament />} />
      <Route path="/tournament/:id" element={<Tournament />} />
      <Route path="/tournament-apply" element={<TournamentApply />} />
      <Route path="/applications" element={<Applications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/business" element={<Business />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <div className="app">
      <MeProvider>
        <AppRoutes />
      </MeProvider>
    </div>
  )
}
