import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Chevron } from './icons.jsx'

const MENU_MAX = 320
const GAP = 6

/**
 * Custom select (ARIA "select-only combobox"). The menu is rendered in <body> with fixed
 * positioning so no parent's overflow can clip it, and flips upward when there is no room below.
 *
 * options: [{ value, label, short?, lang? }]  — `short` is shown on the button instead of `label`
 * emptyValue: the value that means "nothing chosen" (button text is muted)
 * variant: 'field' (inside the search bar) | 'lang' (compact, header)
 */
export default function Select({ value, onChange, options, label, icon, emptyValue = '', variant = 'field', align = 'start' }) {
  const id = useId()
  const btn = useRef(null)
  const menu = useRef(null)
  const items = useRef([])
  const typed = useRef({ text: '', at: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState(null)

  const selected = Math.max(0, options.findIndex((o) => o.value === value))
  const current = options[selected]

  const show = () => { typed.current.text = ''; setActive(selected); setOpen(true) }
  const hide = () => { typed.current.text = ''; setOpen(false); setPos(null) }
  const choose = (i) => { onChange(options[i].value); hide(); btn.current?.focus() }

  // Place the menu under the button (or above it when it does not fit).
  useLayoutEffect(() => {
    if (!open || !menu.current) return
    const r = btn.current.getBoundingClientRect()
    const full = menu.current.scrollHeight + 2
    const below = window.innerHeight - r.bottom - GAP - 8
    const up = full > below && r.top > below
    const maxH = Math.min(MENU_MAX, (up ? r.top : window.innerHeight - r.bottom) - GAP - 8)
    const width = Math.max(r.width, variant === 'lang' ? 168 : 0)
    const left = align === 'end' ? Math.max(8, r.right - width) : Math.min(r.left, window.innerWidth - width - 8)
    setPos({ top: up ? r.top - Math.min(full, maxH) - GAP : r.bottom + GAP, left, width, maxH })
  }, [open, align, variant, options.length])

  // Close on outside click, scroll elsewhere and resize.
  useEffect(() => {
    if (!open) return
    const inside = (e) => e.target instanceof Node && (btn.current?.contains(e.target) || menu.current?.contains(e.target))
    const outside = (e) => { if (!inside(e)) hide() }
    const scrolled = (e) => { if (!(e.target instanceof Node && menu.current?.contains(e.target))) hide() }
    document.addEventListener('pointerdown', outside)
    window.addEventListener('scroll', scrolled, true)
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('scroll', scrolled, true)
      window.removeEventListener('resize', hide)
    }
  }, [open])

  // Keep the active option visible inside a scrolling menu.
  useEffect(() => {
    const el = items.current[active]
    const m = menu.current
    if (!open || !el || !m) return
    if (el.offsetTop < m.scrollTop) m.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > m.scrollTop + m.clientHeight) m.scrollTop = el.offsetTop + el.offsetHeight - m.clientHeight
  }, [active, open, pos])

  // Type a few letters to jump to an option, like a native select.
  const find = (key) => {
    const now = Date.now()
    typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : '') + key.toLowerCase(), at: now }
    const t = typed.current.text
    const from = t.length === 1 ? (open ? active : selected) + 1 : (open ? active : selected)
    const order = [...options.keys()].map((_, k) => (from + k) % options.length)
    return order.find((i) => options[i].label.toLowerCase().startsWith(t))
  }

  const onKeyDown = (e) => {
    const last = options.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show() }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const i = find(e.key)
        if (i !== undefined) onChange(options[i].value)
      }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(last, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(last) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active) }
    else if (e.key === 'Escape') { e.preventDefault(); hide() }
    else if (e.key === 'Tab') hide()
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const i = find(e.key)
      if (i !== undefined) setActive(i)
    }
  }

  const wrap = variant === 'lang' ? `sel sel-lang${open ? ' open' : ''}` : `field sel${open ? ' open' : ''}`

  return (
    <div className={wrap}>
      {icon}
      <button
        ref={btn}
        type="button"
        role="combobox"
        className="sel-btn"
        aria-label={`${label}: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-o${active}` : undefined}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
      >
        <span className={value === emptyValue ? 'val muted' : 'val'} lang={current.lang}>{current.short ?? current.label}</span>
        <Chevron size={14} className="chev" />
      </button>

      {open && createPortal(
        <ul
          ref={menu}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="sel-menu"
          style={pos ? { top: pos.top, left: pos.left, minWidth: pos.width, maxHeight: pos.maxH } : { top: 0, left: 0, visibility: 'hidden' }}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              ref={(el) => { items.current[i] = el }}
              id={`${id}-o${i}`}
              role="option"
              lang={o.lang}
              aria-selected={o.value === value}
              className={i === active ? 'sel-opt act' : 'sel-opt'}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()} // keep focus on the button
              onClick={() => choose(i)}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={16} />}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  )
}
