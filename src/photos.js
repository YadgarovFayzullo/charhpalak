// Landing photos from Unsplash (free Unsplash License). The CDN resizes and serves AVIF/WebP.
const IDS = {
  heroPadel: 'photo-1767128890583-b3f8dc30bdbc', // man playing padel indoors
  heroSwim: 'photo-1530549387789-4c1017266635', // butterfly stroke
  heroBasketball: 'photo-1636662978233-bbaf957292c9', // young men playing basketball
  billiardsBar: 'photo-1641393553834-38578d1f6116', // pool table in a bar with a neon sign
  billiardsPlayer: 'photo-1575553939928-d03b21323afe', // man playing pool
  coachTennis: 'photo-1545809074-59472b3f5ecc', // woman with tennis ball and racket
  coachSwim: 'photo-1586731023793-871d4799d0ed', // man in blue goggles
  shop: 'photo-1646649853703-7645147474ba', // tennis rackets and balls on a court
  chess: 'photo-1523875194681-bedd468c58bf', // man playing chess
  tennis: 'photo-1709403552725-97e0ba206cb8', // female tennis player in action
  marathon: 'photo-1745790289741-12a211a8325d', // marathon on a city street
  basketballCup: 'photo-1762025772651-ac4520ba44f2', // indoor basketball game
}

const url = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

/** <img> props for a photo shown about `width` CSS px wide: 1x and 2x (Retina) sources. */
export function photo(name, width) {
  const id = IDS[name]
  return { src: url(id, width), srcSet: `${url(id, width)} 1x, ${url(id, width * 2)} 2x`, decoding: 'async' }
}
