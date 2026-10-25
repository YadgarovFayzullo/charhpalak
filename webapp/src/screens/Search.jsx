import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import TabBar from '../components/TabBar.jsx'
import { ChipGroup, Segmented, Sheet, Switch } from '../components/ui.jsx'
import { ErrorBox, Loading } from '../components/State.jsx'
import { Search as SearchIcon, Filter } from '../components/icons.jsx'
import { useApi } from '../api.js'
import { money } from '../format.js'

const SPORTS = ['Hammasi', 'Bilyard', 'Futbol', 'Tennis', 'Suzish', 'Padel', 'Basketbol']
const DISTRICTS = ['Yunusobod', 'Chilonzor', 'Mirzo Ulug‘bek', 'Yakkasaroy']
const DEFAULT_FILTERS = { freeOnly: true, district: null, maxPrice: 200000, rating: '4.5+' }
const NO_FILTERS = { freeOnly: false, district: null, maxPrice: 300000, rating: null }

const short = (n) => money(n).replace(' so‘m', '')

// Wait until the user stops typing before hitting the API.
function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [sport, setSport] = useState('Hammasi')
  const [view, setView] = useState('list')
  const [sheet, setSheet] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [pin, setPin] = useState(null)
  const q = useDebounced(query)

  const res = useApi('/api/clubs', {
    params: {
      sport, q,
      district: filters.district,
      max_price: filters.maxPrice < 300000 ? filters.maxPrice : null,
      min_rating: filters.rating ? parseFloat(filters.rating) : null,
      free_only: filters.freeOnly || null,
    },
  })
  const venues = res.data || []
  const activeFilters = [filters.freeOnly, filters.district, filters.maxPrice < 300000, filters.rating].filter(Boolean).length
  const set = (patch) => setFilters({ ...filters, ...patch })
  const selected = venues.find((c) => c.id === pin) || venues[0]

  return (
    <Screen back="/">
      <div className="search-top">
        <div className="row gap-8">
          <label htmlFor="q" className="search-field">
            <SearchIcon size={18} strokeWidth={2} />
            <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Klub yoki sport" />
          </label>
          <button type="button" className="icon-btn" aria-label="Filtrlar" onClick={() => setSheet(true)}>
            <Filter />{activeFilters > 0 && <span className="badge">{activeFilters}</span>}
          </button>
        </div>
        <ChipGroup options={SPORTS} value={sport} onChange={setSport} scroll />
        <Segmented options={[['list', 'Ro‘yxat'], ['map', 'Xarita']]} value={view} onChange={setView} />
      </div>

      <div className="body pad" style={{ padding: '14px 16px', gap: 12 }}>
        {res.error && !res.data ? <ErrorBox error={res.error} onRetry={res.reload} /> : !res.data ? <Loading /> : view === 'list' ? (
          <>
            <span className="mu fs13">{venues.length} ta joy · yaqinroq birinchi</span>
            {venues.map((v) => (
              <article key={v.id} className="card" style={{ overflow: 'hidden' }}>
                <Link to={`/club/${v.id}`} className="venue-row">
                  <img src={v.img} alt={v.name} />
                  <span className="col gap-4" style={{ minWidth: 0 }}>
                    <b className="fs16">{v.name}</b>
                    <span className="mu fs12">{v.sport} · {v.district} · {v.dist}</span>
                    <span className="fs13">★ {v.rating} · <b>{short(v.price)}</b>/soat dan</span>
                  </span>
                </Link>
                {v.slots.length > 0 && (
                  <div className="row gap-6" style={{ overflowX: 'auto', padding: '0 12px 12px' }}>
                    {v.slots.map((s) => <Link key={s} to={`/club/${v.id}`} state={{ slot: s }} className="slot">{s}</Link>)}
                  </div>
                )}
              </article>
            ))}
            {venues.length === 0 && <span className="mu center" style={{ padding: 24 }}>Hech narsa topilmadi. Filtrlarni o‘zgartiring.</span>}
          </>
        ) : (
          <div className="map" role="img" aria-label="Xaritadagi klublar">
            {venues.map((v) => (
              <button key={v.id} type="button" className={`pill map-pin${selected?.id === v.id ? ' on' : ''}`} style={v.map} onClick={() => setPin(v.id)}>
                {short(v.price)}
              </button>
            ))}
            <span className="map-me" />
            {selected && (
              <Link to={`/club/${selected.id}`} className="card map-card">
                <img src={selected.img} alt="" />
                <span className="col"><b>{selected.name}</b><span className="mu fs12">{selected.dist} · ★ {selected.rating}{selected.nextFree && ` · ${selected.nextFree} bo‘sh`}</span></span>
              </Link>
            )}
          </div>
        )}
      </div>

      <TabBar />

      {sheet && (
        <Sheet className="sheet-dark" onClose={() => setSheet(false)}>
          <span className="grabber" />
          <div className="between">
            <b className="d fs22">Filtrlar</b>
            <button type="button" className="ghost-btn" style={{ fontWeight: 600, color: 'var(--lime)' }} onClick={() => setFilters(NO_FILTERS)}>Tozalash</button>
          </div>
          <button type="button" className="between" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => set({ freeOnly: !filters.freeOnly })} aria-pressed={filters.freeOnly}>
            <span className="col"><b className="fs15">Faqat bo‘sh vaqti borlar</b><span className="mu fs12">Bugun, hozirdan keyin</span></span>
            <Switch on={filters.freeOnly} />
          </button>
          <div className="col gap-8">
            <b className="fs15">Tuman</b>
            <ChipGroup options={DISTRICTS} value={filters.district} onChange={(d) => set({ district: filters.district === d ? null : d })} />
          </div>
          <div className="col gap-8">
            <div className="between"><label htmlFor="pr" className="fs15" style={{ fontWeight: 700 }}>Narx, soatiga</label><span className="mu fs13">{filters.maxPrice < 300000 ? `${short(filters.maxPrice)} gacha` : 'har qanday'}</span></div>
            <input id="pr" type="range" min="20000" max="300000" step="10000" value={filters.maxPrice} onChange={(e) => set({ maxPrice: Number(e.target.value) })} />
          </div>
          <div className="col gap-8">
            <b className="fs15">Reyting</b>
            <ChipGroup options={['4.0+', '4.5+']} value={filters.rating} onChange={(r) => set({ rating: filters.rating === r ? null : r })} />
          </div>
          <button type="button" className="mbb" onClick={() => setSheet(false)}>{venues.length} ta joyni ko‘rsatish</button>
        </Sheet>
      )}
    </Screen>
  )
}
