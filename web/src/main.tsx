import './style.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:3001'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-blue-600" />
            <span className="text-xl font-semibold tracking-tight">AgriTrace</span>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="text-gray-700 hover:text-blue-700">Home</Link>
            <Link to="/farmer" className="text-gray-700 hover:text-blue-700">Farmer</Link>
            <Link to="/distributor" className="text-gray-700 hover:text-blue-700">Distributor</Link>
            <Link to="/consumer" className="text-gray-700 hover:text-blue-700">Consumer</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} AgriTrace</span>
          <span>Built for MVP demo</span>
        </div>
      </footer>
    </div>
  )
}

function Home() {
  return (
    <Layout>
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white shadow-sm">
        <div className="absolute inset-0 [mask-image:radial-gradient(closest-side,white,transparent)] opacity-30">
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight">Transparent farm-to-fork traceability</h2>
            <p className="mt-3 text-white/90">Register produce, transfer ownership, and let consumers verify provenance instantly.</p>
            <div className="mt-5 flex gap-3">
              <a href="/farmer" className="rounded-lg bg-white text-blue-700 px-4 py-2 font-medium shadow hover:shadow-md transition">Get started</a>
              <a href="/consumer" className="rounded-lg ring-1 ring-white/60 text-white px-4 py-2 font-medium hover:bg-white/10 transition">View a batch</a>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-xl bg-white/10 backdrop-blur p-5 ring-1 ring-white/20 shadow-lg">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-white/10 p-4">Farmer → Add</div>
                <div className="rounded-lg bg-white/10 p-4">Distributor → Transfer</div>
                <div className="rounded-lg bg-white/10 p-4">Consumer → Verify</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
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

function Farmer() {
  const [cropName, setCropName] = React.useState('Wheat')
  const [quantity, setQuantity] = React.useState('100')
  const [harvestDate, setHarvestDate] = React.useState('10 Sept 2025')
  const [out, setOut] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/produce`, { cropName, quantity: Number(quantity), harvestDate })
      setOut(JSON.stringify(res.data, null, 2))
    } catch (err: any) {
      setError(err?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Layout>
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Add Produce</h2>
        <form onSubmit={submit} className="grid gap-4 rounded-xl bg-white p-5 border shadow-sm">
          {error ? <Banner kind="error" text={error} /> : null}
          <Field label="Crop Name">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={cropName} onChange={e=>setCropName(e.target.value)} placeholder="e.g. Wheat" />
          </Field>
          <Field label="Quantity (units)">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="e.g. 100" />
          </Field>
          <Field label="Harvest Date" hint="Human-readable date for demo">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={harvestDate} onChange={e=>setHarvestDate(e.target.value)} placeholder="e.g. 10 Sept 2025" />
          </Field>
          <button disabled={loading} className={`rounded-lg px-4 py-2 text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition`}>{loading ? 'Submitting…' : 'Submit'}</button>
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
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/transfer`, { batchId: Number(batchId), to, price: Number(price) })
      setOut(JSON.stringify(res.data, null, 2))
    } catch (err: any) {
      setError(err?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Layout>
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Transfer Ownership</h2>
        <form onSubmit={submit} className="grid gap-4 rounded-xl bg-white p-5 border shadow-sm">
          {error ? <Banner kind="error" text={error} /> : null}
          <Field label="Batch ID">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={batchId} onChange={e=>setBatchId(e.target.value)} placeholder="e.g. 0" />
          </Field>
          <Field label="Recipient Address">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={to} onChange={e=>setTo(e.target.value)} placeholder="0x..." />
          </Field>
          <Field label="Price">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. 20" />
          </Field>
          <button disabled={loading} className={`rounded-lg px-4 py-2 text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition`}>{loading ? 'Transferring…' : 'Transfer'}</button>
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
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/getProduce/${Number(batchId)}`)
      setOut(JSON.stringify(res.data, null, 2))
    } catch (err: any) {
      setError(err?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Layout>
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">View Produce</h2>
        <form onSubmit={submit} className="grid gap-4 rounded-xl bg-white p-5 border shadow-sm">
          {error ? <Banner kind="error" text={error} /> : null}
          <Field label="Batch ID">
            <input className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" value={batchId} onChange={e=>setBatchId(e.target.value)} placeholder="e.g. 0" />
          </Field>
          <button disabled={loading} className={`rounded-lg px-4 py-2 text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition`}>{loading ? 'Loading…' : 'Lookup'}</button>
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


