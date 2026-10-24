const COACHES = [
  { name: 'Malika R.', rating: '4.9', img: '/images/coach-tennis.jpg', alt: 'Tennis murabbiyi Malika', meta: 'Tennis · 8 yil tajriba · «Olimp» korti', price: '150 000 so‘m / dars' },
  { name: 'Bekzod T.', rating: '4.8', img: '/images/coach-swim.jpg', alt: 'Suzish murabbiyi Bekzod', meta: 'Suzish · boshlang‘ichdan professionalgacha', price: '120 000 so‘m / dars' },
]

export default function Coaches() {
  return (
    <section className="light" id="coaches">
      <div className="wrap section coaches-grid">
        <div className="stack-20">
          <span className="ey ey-dark">Murabbiylar</span>
          <h2 className="d h2-md">Murabbiy bilan yangi bosqichga chiqing.</h2>
          <p className="ink-mu">
            Tajribali murabbiylar, ochiq jadval va oldindan to‘lov. Murabbiylar uchun obuna yo‘q, faqat har darsdan 5%.
          </p>
          <div className="row row-center">
            <a href="#" className="btn bd">Murabbiy topish</a>
            <a href="#" className="ink-link">Murabbiy sifatida qo‘shilish</a>
          </div>
        </div>
        {COACHES.map((c) => (
          <a key={c.name} href="#" className="coach">
            <img src={c.img} alt={c.alt} />
            <div className="coach-body">
              <div className="coach-top"><b>{c.name}</b><span>★ {c.rating}</span></div>
              <span className="coach-meta">{c.meta}</span>
              <span className="coach-price">{c.price}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
