import { Routes, Route, Navigate } from 'react-router-dom'
import { isOnboarded } from './storage.js'
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

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={isOnboarded() ? <Home /> : <Navigate to="/start" replace />} />
        <Route path="/start" element={<Start />} />
        <Route path="/search" element={<Search />} />
        <Route path="/club/:id" element={<Club />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/done" element={<Confirmed />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/new" element={<NewGame />} />
        <Route path="/tournament/:id" element={<Tournament />} />
        <Route path="/tournament-apply" element={<TournamentApply />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/business" element={<Business />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
