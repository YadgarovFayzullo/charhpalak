import { haptic } from '../telegram.js'

// Single-choice chip row. `value` is the selected option.
export function ChipGroup({ options, value, onChange, className = 'chip', wrap = true, scroll = false }) {
  return (
    <div className={scroll ? 'hscroll' : wrap ? 'chips' : 'row-8'}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={value === o ? `${className} on` : className}
          aria-pressed={value === o}
          onClick={() => { haptic('light'); onChange(o) }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// Multi-choice chip row. `value` is a Set-like object { option: true }.
export function MultiChips({ options, value, onChange }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={value[o] ? 'chip on' : 'chip'}
          aria-pressed={Boolean(value[o])}
          onClick={() => { haptic('light'); onChange({ ...value, [o]: !value[o] }) }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function Segmented({ options, value, onChange, small = false }) {
  return (
    <div className="segs" role="tablist">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          className={`seg${small ? ' seg-sm' : ''}${value === id ? ' on' : ''}`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function UnderlineTabs({ options, value, onChange, label }) {
  return (
    <div className="utabs" role="tablist" aria-label={label}>
      {options.map(([id, text]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} className={value === id ? 'tb on' : 'tb'} onClick={() => onChange(id)}>
          {text}
        </button>
      ))}
    </div>
  )
}

export function Switch({ on }) {
  return <span className={on ? 'sw on' : 'sw'} aria-hidden="true"><span /></span>
}

// A full-width row button with title, hint and a switch on the right.
export function ToggleRow({ title, hint, on, onToggle }) {
  return (
    <button type="button" className="card toggle-row" aria-pressed={on} onClick={() => { haptic('light'); onToggle() }}>
      <span className="col flex1"><b className="fs15">{title}</b><span className="mu fs12">{hint}</span></span>
      <Switch on={on} />
    </button>
  )
}

export function Sheet({ children, onClose, className = '' }) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`sheet ${className}`}>{children}</div>
    </div>
  )
}

export function Bars({ total, current }) {
  return (
    <div className="bars">
      {Array.from({ length: total }, (_, i) => <span key={i} className={i <= current ? 'bar on' : 'bar'} />)}
    </div>
  )
}

export function Done({ title, text, children }) {
  return (
    <div className="done">
      <span className="done-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F1F14" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg></span>
      <h1 className="d fs28">{title}</h1>
      <span className="mu fs15 measure">{text}</span>
      {children}
    </div>
  )
}
