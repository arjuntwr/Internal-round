import './style.css'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE =
  (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:3000'

/* ---------------- Layout ---------------- */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex flex-col">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow">
              A
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-blue-700 drop-shadow">
              AgriTrace
            </span>
          </div>
          <nav className="hidden md:flex gap-6 text-base font-medium">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/farmer" className="nav-link">
              Farmer
            </Link>
            <Link to="/distributor" className="nav-link">
              Distributor
            </Link>
            <Link to="/consumer" className="nav-link">
              Consumer
            </Link>
          </nav>
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

/* ---------------- Reusable UI ---------------- */
function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="p-2 rounded hover:bg-blue-100"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
      >
        ☰
      </button>
      {open && (
        <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border w-40 flex flex-col z-30 animate-fadein">
          {['Home', 'Farmer', 'Distributor', 'Consumer'].map((page) => (
            <Link
              key={page}
              to={page === 'Home' ? '/' : `/${page.toLowerCase()}`}
              className="px-4 py-2 hover:bg-blue-50"
              onClick={() => setOpen(false)}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
    </label>
  )
}

function Banner({ kind, text }: { kind: 'success' | 'error' | 'info'; text: string }) {
  const styles =
    kind === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : kind === 'error'
      ? 'bg-red-50 text-red-800 border-red-200'
      : 'bg-blue-50 text-blue-800 border-blue-200'
  return (
    <div className={`border rounded-lg px-3 py-2 text-sm ${styles}`}>
      {text}
    </div>
  )
}

function Toast({
  message,
  kind,
  onClose,
}: {
  message: string
  kind: 'success' | 'error'
  onClose: () => void
}) {
  return (
    <div
      className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-semibold animate-fadein ${
        kind === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {message}
      <button
        className="ml-3 text-white/80 hover:text-white"
        onClick={onClose}
      >
        &times;
      </button>
    </div>
  )
}

/* ---------------- Pages ---------------- */
function Home() {
  return (
    <Layout>
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white shadow-xl animate-slidein">
        <div className="relative p-10 md:p-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
              Transparent farm-to-fork traceability
            </h1>
            <p className="mt-4 text-white/90 text-lg">
              Register produce, transfer ownership, and let consumers verify
              provenance instantly.
            </p>
            <div className="mt-7 flex gap-4">
              <Link
                to="/farmer"
                className="rounded-lg bg-white text-blue-700 px-6 py-3 font-bold shadow hover:shadow-lg hover:-translate-y-1 transition text-lg"
              >
                Get started
              </Link>
              <Link
                to="/consumer"
                className="rounded-lg ring-1 ring-white/60 text-white px-6 py-3 font-bold hover:bg-white/10 transition text-lg"
              >
                View a batch
              </Link>
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

function Card({
  title,
  desc,
  to,
}: {
  title: string
  desc: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition bg-white"
    >
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
    </Link>
  )
}

/* Farmer Page */
function Farmer() {
  const [cropName, setCropName] = useState('Wheat')
  const [quantity, setQuantity] = useState('100')
  const [harvestDate, setHarvestDate] = useState('10 Sept 2025')
  const [out, setOut] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(
    null
  )

  const validate = () => {
    if (!cropName.trim()) return 'Crop name is required.'
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0)
      return 'Quantity must be a positive number.'
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
      const res = await axios.post(`${API_BASE}/produce`, {
        cropName,
        quantity: Number(quantity),
        harvestDate,
      })
      setOut(JSON.stringify(res.data, null, 2))
      setToast({ message: 'Produce added successfully!', kind: 'success' })
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Request failed'
      setError(msg)
      setToast({ message: msg, kind: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      {toast && (
        <Toast
          message={toast.message}
          kind={toast.kind}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Add Produce</h2>
        <form
          onSubmit={submit}
          className="grid gap-5 rounded-xl bg-white p-6 border shadow-md animate-fadein"
        >
          {error && <Banner kind="error" text={error} />}
          <Field label="Crop Name" hint="e.g. Wheat">
            <input
              className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g. Wheat"
            />
          </Field>
          <Field label="Quantity (units)" hint="Must be a positive number">
            <input
              className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 100"
            />
          </Field>
          <Field label="Harvest Date" hint="Human-readable date for demo">
            <input
              className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              placeholder="e.g. 10 Sept 2025"
            />
          </Field>
          <button
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-white ${
              loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
            } transition flex items-center justify-center`}
          >
            {loading ? 'Submitting…' : 'Submit'}
          </button>
          <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded border">
            {out}
          </pre>
        </form>
      </div>
    </Layout>
  )
}

/* Distributor Page */
function Distributor() {
  // Similar to Farmer → with validation + toast
  // (keep code DRY by extracting validation functions if you want)
  return <Layout>Distributor Page TODO</Layout>
}

/* Consumer Page */
function Consumer() {
  return <Layout>Consumer Page TODO</Layout>
}

/* ---------------- App ---------------- */
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
  </React.StrictMode>
)
