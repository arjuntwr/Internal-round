import './style.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import { useState } from 'react'

const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:3000'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex flex-col">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow">A</div>
            <span className="text-2xl font-extrabold tracking-tight text-blue-700 drop-shadow">AgriTrace</span>
          </div>
          <nav className="hidden md:flex gap-6 text-base font-medium">
            <Link to="/" className="text-gray-700 hover:text-blue-700 transition">Home</Link>
            <Link to="/farmer" className="text-gray-700 hover:text-blue-700 transition">Farmer</Link>
            <Link to="/distributor" className="text-gray-700 hover:text-blue-700 transition">Distributor</Link>
            <Link to="/consumer" className="text-gray-700 hover:text-blue-700 transition">Consumer</Link>
          </nav>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 animate-fadein">
        {children}
      </main>
      <footer className="border-t bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} AgriTrace</span>
          <span>Built for MVP demo</span>
        </div>
      </footer>
    </div>
  )
}

function MobileMenu() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button className="p-2 rounded hover:bg-blue-100" onClick={() => setOpen(o => !o)} aria-label="Menu">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      {open && (
        <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border w-40 flex flex-col z-30 animate-fadein">
          <Link to="/" className="px-4 py-2 hover:bg-blue-50" onClick={()=>setOpen(false)}>Home</Link>
          <Link to="/farmer" className="px-4 py-2 hover:bg-blue-50" onClick={()=>setOpen(false)}>Farmer</Link>
          <Link to="/distributor" className="px-4 py-2 hover:bg-blue-50" onClick={()=>setOpen(false)}>Distributor</Link>
          <Link to="/consumer" className="px-4 py-2 hover:bg-blue-50" onClick={()=>setOpen(false)}>Consumer</Link>
        </div>
      )}
    </>
  )
}

function Home() {
  return (
    <Layout>
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white shadow-xl animate-slidein">
        <div className="absolute inset-0 [mask-image:radial-gradient(closest-side,white,transparent)] opacity-30 pointer-events-none">
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/20 blur-2xl animate-pulse" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-white/10 blur-2xl animate-pulse" />
        </div>
        <div className="relative p-10 md:p-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">Transparent farm-to-fork traceability</h1>
            <p className="mt-4 text-white/90 text-lg">Register produce, transfer ownership, and let consumers verify provenance instantly. <span className="inline-block bg-white/20 rounded px-2 py-0.5 ml-1 text-xs font-semibold tracking-wide">Powered by Blockchain</span></p>
            <div className="mt-7 flex gap-4">
              <a href="/farmer" className="rounded-lg bg-white text-blue-700 px-6 py-3 font-bold shadow hover:shadow-lg hover:-translate-y-1 transition text-lg">Get started</a>
              <a href="/consumer" className="rounded-lg ring-1 ring-white/60 text-white px-6 py-3 font-bold hover:bg-white/10 transition text-lg">View a batch</a>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-xl bg-white/10 backdrop-blur p-7 ring-1 ring-white/20 shadow-lg animate-fadein">
              <div className="grid grid-cols-3 gap-4 text-base">
                <div className="rounded-lg bg-white/10 p-6 font-semibold">Farmer <span className="block text-xs font-normal">Add</span></div>
                <div className="rounded-lg bg-white/10 p-6 font-semibold">Distributor <span className="block text-xs font-normal">Transfer</span></div>
                <div className="rounded-lg bg-white/10 p-6 font-semibold">Consumer <span className="block text-xs font-normal">Verify</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-10 grid gap-7 md:grid-cols-3">
        <Card title="Farmer" to="/farmer" desc="Add produce" />
        <Card title="Distributor" to="/distributor" desc="Transfer ownership" />
        <Card title="Consumer" to="/consumer" desc="View history" />
      </div>
    </Layout>
  )
}

function Card({ title, desc, to }: { title: string, desc: string, to: string }) {
  return (
    <Link to={to} className="rounded-xl border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition bg-white">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
    </Link>
  )
}

function Field({ label, children, hint }: { label: string, children: React.ReactNode, hint?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
    </label>
  )
}

function Banner({ kind, text }: { kind: 'success' | 'error' | 'info', text: string }) {
  const styles = kind === 'success' ? 'bg-green-50 text-green-800 border-green-200'
    : kind === 'error' ? 'bg-red-50 text-red-800 border-red-200'
    : 'bg-blue-50 text-blue-800 border-blue-200'
  return <div className={`border rounded-lg px-3 py-2 text-sm ${styles}`}>{text}</div>
}

function Toast({ message, kind, onClose }: { message: string, kind: 'success' | 'error', onClose: () => void }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-semibold transition-all animate-fadein ${kind === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{message}
      <button className="ml-3 text-white/80 hover:text-white" onClick={onClose}>&times;</button>
    </div>
  )
}

function Farmer() {
  const [cropName, setCropName] = useState('Wheat')
  const [quantity, setQuantity] = useState('100')
  const [harvestDate, setHarvestDate] = useState('10 Sept 2025')
  const [out, setOut] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, kind: 'success' | 'error' } | null>(null)

  const validate = () => {
    if (!cropName.trim()) return 'Crop name is required.'
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) return 'Quantity must be a positive number.'
    if (!harvestDate.trim()) return 'Harvest date is required.'
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/produce`, { cropName, quantity: Number(quantity), harvestDate })
      setOut(JSON.stringify(res.data, null, 2))
      setToast({ message: 'Produce added successfully!', kind: 'success' })
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Request failed')
      setToast({ message: err?.response?.data?.error || 'Failed to add produce', kind: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Add Produce</h2>
        <form onSubmit={submit} className="grid gap-5 rounded-xl bg-white p-6 border shadow-md animate-fadein">
          {error ? <Banner kind="error" text={error} /> : null}
          <Field label="Crop Name" hint="e.g. Wheat">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={cropName} onChange={e=>setCropName(e.target.value)} placeholder="e.g. Wheat" />
          </Field>
          <Field label="Quantity (units)" hint="Must be a positive number">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="e.g. 100" />
          </Field>
          <Field label="Harvest Date" hint="Human-readable date for demo">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={harvestDate} onChange={e=>setHarvestDate(e.target.value)} placeholder="e.g. 10 Sept 2025" />
          </Field>
          <button disabled={loading} className={`rounded-lg px-4 py-2 text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition flex items-center justify-center`}>
            {loading && <span className="loader mr-2"></span>}{loading ? 'Submitting…' : 'Submit'}
          </button>
          <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded border">{out}</pre>
        </form>
      </div>
    </Layout>
  )
}

function Distributor() {
  const [batchId, setBatchId] = React.useState('0')
  const [to, setTo] = React.useState('0x2ACfBaC0C9AE7b16DB3274785d265CFe440773de')
  const [price, setPrice] = React.useState('20')
  const [out, setOut] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, kind: 'success' | 'error' } | null>(null)

  const validate = () => {
    if (!batchId.trim()) return 'Batch ID is required.'
    if (!to.trim()) return 'Recipient address is required.'
    if (!price || isNaN(Number(price)) || Number(price) <= 0) return 'Price must be a positive number.'
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/transfer`, { batchId: Number(batchId), to, price: Number(price) })
      setOut(JSON.stringify(res.data, null, 2))
      setToast({ message: 'Ownership transferred successfully!', kind: 'success' })
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Request failed')
      setToast({ message: err?.response?.data?.error || 'Failed to transfer ownership', kind: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Transfer Ownership</h2>
        <form onSubmit={submit} className="grid gap-5 rounded-xl bg-white p-6 border shadow-md animate-fadein">
          {error ? <Banner kind="error" text={error} /> : null}
          <Field label="Batch ID" hint="e.g. 0">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={batchId} onChange={e=>setBatchId(e.target.value)} placeholder="e.g. 0" />
          </Field>
          <Field label="Recipient Address" hint="e.g. 0x2ACfBaC0C9AE7b16DB3274785d265CFe440773de">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={to} onChange={e=>setTo(e.target.value)} placeholder="e.g. 0x2ACfBaC0C9AE7b16DB3274785d265CFe440773de" />
          </Field>
          <Field label="Price" hint="e.g. 20">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. 20" />
          </Field>
          <button disabled={loading} className={`rounded-lg px-4 py-2 text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition flex items-center justify-center`}>
            {loading && <span className="loader mr-2"></span>}{loading ? 'Transferring…' : 'Transfer'}
          </button>
          <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded border">{out}</pre>
        </form>
      </div>
    </Layout>
  )
}

function Consumer() {
  const [batchId, setBatchId] = React.useState('0')
  const [out, setOut] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, kind: 'success' | 'error' } | null>(null)

  const validate = () => {
    if (!batchId.trim()) return 'Batch ID is required.'
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/getProduce/${Number(batchId)}`)
      setOut(JSON.stringify(res.data, null, 2))
      setToast({ message: 'Produce fetched successfully!', kind: 'success' })
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Request failed')
      setToast({ message: err?.response?.data?.error || 'Failed to fetch produce', kind: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">View Produce</h2>
        <form onSubmit={submit} className="grid gap-5 rounded-xl bg-white p-6 border shadow-md animate-fadein">
          {error ? <Banner kind="error" text={error} /> : null}
          <Field label="Batch ID" hint="e.g. 0">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={batchId} onChange={e=>setBatchId(e.target.value)} placeholder="e.g. 0" />
          </Field>
          <button disabled={loading} className={`rounded-lg px-4 py-2 text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition flex items-center justify-center`}>
            {loading && <span className="loader mr-2"></span>}{loading ? 'Loading…' : 'Lookup'}
          </button>
          <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded border">{out}</pre>
        </form>
      </div>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/farmer" element={<Farmer />} />
        <Route path="/distributor" element={<Distributor />} />
        <Route path="/consumer" element={<Consumer />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


