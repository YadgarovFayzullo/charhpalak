/**
 * Sends a lead (sponsor request) to the CRM.
 * The CRM endpoint is not connected yet: set VITE_LEADS_URL (POST, JSON) and leads go there.
 * Until then they are only kept in this browser (localStorage "charhpalak.leads"), so nothing reaches the team.
 */
const URL = import.meta.env.VITE_LEADS_URL

export async function submitLead(lead) {
  const body = { ...lead, source: 'landing', createdAt: new Date().toISOString() }
  if (URL) {
    const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) throw new Error(`lead ${r.status}`)
    return
  }
  try {
    const key = 'charhpalak.leads'
    const all = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([...all, body]))
  } catch { /* storage unavailable: still show success, the form is a placeholder until the CRM is connected */ }
}
