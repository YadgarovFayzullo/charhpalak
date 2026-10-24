import { useState } from 'react'

const FAQS = [
  { q: 'Platforma kimlar uchun?', a: 'O‘yinchilar, klublar, murabbiylar, turnir tashkilotchilari va homiylar uchun. O‘yinchilar uchun bepul.' },
  { q: 'Bronni qanday bekor qilaman?', a: '«Mening sahifam»da bronni oching va «Bekor qilish»ni bosing. O‘yindan 2 soat oldingacha depozit to‘liq qaytariladi.' },
  { q: 'To‘lov qanday qilinadi?', a: 'Click yoki Payme orqali depozit. Ba’zi klublar joyida to‘lashga ham ruxsat beradi.' },
  { q: 'Klubni qanday ulash mumkin?', a: '«Klubni ulash» sahifasida ariza qoldiring. Menejer 24 soat ichida qo‘ng‘iroq qilib, tizimni sozlab beradi.' },
]

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section className="wrap section faq-grid">
      <div className="stack-14">
        <h2 className="d h2-md">Savollaringiz bormi?</h2>
        <p className="mu">Javob topmasangiz, Telegramda yozing: <b className="ink-light">@kigo_sherik</b></p>
      </div>
      <div className="stack-10">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q}>
              <button
                type="button"
                className="faq"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                {f.q}
                <span aria-hidden="true" className="faq-sign">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p id={`faq-${i}`} className="mu faq-a">{f.a}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
