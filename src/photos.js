// Landing photos from Unsplash (free Unsplash License). The CDN resizes and serves AVIF/WebP.
const IDS = {
  heroTennis: 'photo-1597726364265-02f57397c03c', // woman holding a tennis racket
  heroSwim: 'photo-1530549387789-4c1017266635', // butterfly stroke
  heroChess: 'photo-1523875194681-bedd468c58bf', // man playing chess
  tennis: 'photo-1709403552725-97e0ba206cb8', // female tennis player in action
  chess: 'photo-1768839722425-4f209a3e4fda', // hand moving a chess piece
  marathon: 'photo-1745790289741-12a211a8325d', // marathon on a city street
  billiards: 'photo-1544281153-6603be88b354', // person playing billiards
  basketball: 'photo-1786025164219-63c50872c96d', // shot at the hoop, indoor gym
  swim: 'photo-1530549387789-4c1017266635',
}

const url = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

/** <img> props for a photo shown about `width` CSS px wide: 1x and 2x (Retina) sources. */
export function photo(name, width) {
  const id = IDS[name]
  return { src: url(id, width), srcSet: `${url(id, width)} 1x, ${url(id, width * 2)} 2x`, decoding: 'async' }
}
