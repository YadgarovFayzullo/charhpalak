// Landing photos from Unsplash (free Unsplash License). The CDN resizes and serves AVIF/WebP.
const IDS = {
  heroTennis: 'photo-1597726364265-02f57397c03c', // woman holding a tennis racket
  heroSwim: 'photo-1530549387789-4c1017266635', // butterfly stroke
  heroChess: 'photo-1523875194681-bedd468c58bf', // man playing chess
  heroFootball: 'photo-1769859177812-d283ad3a4713', // goalkeeper defends the goal
  heroRun: 'photo-1759674861540-afed9f86f94a', // runners in motion during a race
  heroBasket: 'photo-1759694415651-06e2fe97295a', // players jump for a rebound
  tennis: 'photo-1709403552725-97e0ba206cb8', // female tennis player in action
  chess: 'photo-1768839722425-4f209a3e4fda', // hand moving a chess piece
  marathon: 'photo-1745790289741-12a211a8325d', // marathon on a city street
  billiards: 'photo-1544281153-6603be88b354', // person playing billiards
  basketball: 'photo-1786025164219-63c50872c96d', // shot at the hoop, indoor gym
  swim: 'photo-1530549387789-4c1017266635',
  football: 'photo-1767916732786-a83902ffc25c', // soccer game in a packed stadium at night
  tennis2: 'photo-1554068865-24cecd4e34b8', // man playing tennis
  tennis3: 'photo-1661474974379-0f24bee86ce0', // woman playing tennis
  tennis4: 'photo-1548920168-70d61248a912', // woman in black top holding a racket
  football2: 'photo-1780255431682-df87de2febfa', // players on a green field at dusk
  football3: 'photo-1787535849781-9d35cfde0445', // team celebrating
  football4: 'photo-1769859177812-d283ad3a4713', // goalkeeper defends the goal
  billiards2: 'photo-1599685315659-bc876da49fe5', // billiard balls on the table
  billiards3: 'photo-1545062080-a71640ea75a1', // pool table set
  chess2: 'photo-1529699211952-734e80c4d42b', // chess pieces, selective focus
  chess3: 'photo-1528819622765-d6bcf132f793', // chess pieces on the board
  marathon2: 'photo-1613936360976-8f35cf0e5461', // people running on the road
  marathon3: 'photo-1759674861540-afed9f86f94a', // runners in motion during a race
  swim2: 'photo-1519315901367-f34ff9154487', // person swimming in an olympic pool
  swim3: 'photo-1600965962102-9d260a71890d', // swimmer in goggles
  basketball2: 'photo-1762025772651-ac4520ba44f2', // indoor basketball game
  basketball3: 'photo-1759694415651-06e2fe97295a', // players jump for a rebound
}

const url = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

/** <img> props for a photo shown about `width` CSS px wide: 1x and 2x (Retina) sources. */
export function photo(name, width) {
  const id = IDS[name]
  return { src: url(id, width), srcSet: `${url(id, width)} 1x, ${url(id, width * 2)} 2x`, decoding: 'async' }
}
