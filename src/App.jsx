import Hero from './components/Hero.jsx'
import Steps from './components/Steps.jsx'
import Business from './components/Business.jsx'
import Coaches from './components/Coaches.jsx'
import Tournaments from './components/Tournaments.jsx'
import Partners from './components/Partners.jsx'
import Shop from './components/Shop.jsx'
import Faq from './components/Faq.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="page">
      <Hero />
      <main>
        <Steps />
        <Business />
        <Coaches />
        <Tournaments />
        <Partners />
        <Shop />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
