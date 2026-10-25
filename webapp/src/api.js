import { useCallback, useEffect, useState } from 'react'
import { tg, inTelegram } from './telegram.js'

// Empty = same origin (the dev server proxies /api to the backend).
const BASE = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Every request carries Telegram's signed initData; the backend checks it with the bot token.
export async function api(path, { method = 'GET', body, params } = {}) {
  const url = new URL(BASE + path)
  Object.entries(params || {}).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && url.searchParams.set(k, v))

  const headers = { 'Content-Type': 'application/json' }
  if (inTelegram) headers.Authorization = `tma ${tg.initData}`

  let res
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'Internet aloqasi yo‘q yoki server ishlamayapti')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.detail
    throw new ApiError(res.status, typeof detail === 'string' ? detail : 'Xatolik yuz berdi')
  }
  return data
}

/** Load `path` and keep it in state. `deps` re-run the request (e.g. filters). */
export function useApi(path, { params, skip = false } = {}, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !skip })
  const key = JSON.stringify(params || {})

  const load = useCallback(() => {
    if (skip || !path) return Promise.resolve()
    setState((s) => ({ ...s, loading: true, error: null }))
    return api(path, { params })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState((s) => ({ ...s, error, loading: false })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, skip, ...deps])

  useEffect(() => { load() }, [load])

  const setData = (data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data }))
  return { ...state, reload: load, setData }
}
