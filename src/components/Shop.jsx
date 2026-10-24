export default function Shop() {
  return (
    <section className="light">
      <div className="wrap section-sm shop-grid">
        <div className="stack-18">
          <span className="pill soon">Tez orada</span>
          <h2 className="d h2-md">Sport jihozlari ham shu yerda.</h2>
          <p className="ink-mu">Raketkalar, to‘plar, kiyim va aksessuarlar. Do‘kon ochilganda birinchi bo‘lib xabar oling.</p>
          <form className="row-8" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="shopTel" className="sr-only">Telefon raqam</label>
            <input id="shopTel" type="tel" placeholder="+998 90 123 45 67" className="tel" />
            <button type="submit" className="btn bd btn-52">Xabar bering</button>
          </form>
        </div>
        <img src="/images/shop.jpg" alt="Sport sumkasi, raketka, to‘plar va gantellar" className="shop-img" />
      </div>
    </section>
  )
}
