// Loading and error states shared by screens that fetch data.

export function Loading() {
  return <div className="state" aria-busy="true"><span className="spinner" aria-label="Yuklanmoqda" /></div>
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="state">
      <b className="fs16">Ma’lumotni yuklab bo‘lmadi</b>
      <span className="mu fs14 measure">{error?.message}</span>
      {onRetry && <button type="button" className="mbs" style={{ width: 'auto', padding: '0 20px' }} onClick={onRetry}>Qayta urinish</button>}
    </div>
  )
}

/** Renders loading/error for a useApi result, otherwise the children render function. */
export function Async({ res, children }) {
  if (res.error && !res.data) return <ErrorBox error={res.error} onRetry={res.reload} />
  if (!res.data) return <Loading />
  return children(res.data)
}
