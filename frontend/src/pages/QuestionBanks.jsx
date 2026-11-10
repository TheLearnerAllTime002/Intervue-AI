import React, { useCallback, useEffect, useState } from "react"
import { FiBookmark, FiPlus, FiTrash2 } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { addBankQuestion, createQuestionBank, deleteBankQuestion, deleteQuestionBank, getQuestionBanks } from "../apis/interview.api"
import api from "../utils/axios"
import { signOut } from "firebase/auth"
import { auth } from "../utils/firebase"

function QuestionBanks({ user, setUser }) {
  const [banks, setBanks] = useState([])
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [type, setType] = useState("mixed")
  const [drafts, setDrafts] = useState({})
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [moblieOpen, setMoblieOpen] = useState(false)
  const navigate = useNavigate()

  const logout = async () => {
    try { await api.get("/api/auth/logout") } catch (logoutError) { console.error("Failed to revoke server session:", logoutError) }
    setUser(null)
    await signOut(auth).catch((logoutError) => console.error("Failed to sign out of Firebase:", logoutError))
    navigate("/", { replace: true })
  }

  const loadBanks = useCallback(async () => {
    try {
      const response = await getQuestionBanks()
      setBanks(response.banks || [])
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Could not load question banks.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBanks() }, [loadBanks])

  const createBank = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      const response = await createQuestionBank({ name, role, type })
      setBanks((current) => [response.bank, ...current])
      setName("")
      setRole("")
    } catch (createError) {
      setError(createError.response?.data?.message || "Could not create this question bank.")
    } finally {
      setBusy(false)
    }
  }

  const addQuestion = async (bank) => {
    const question = drafts[bank._id]?.trim()
    if (!question) return
    setBusy(true)
    setError("")
    try {
      const response = await addBankQuestion(bank._id, { question })
      setBanks((current) => current.map((item) => item._id === bank._id ? response.bank : item))
      setDrafts((current) => ({ ...current, [bank._id]: "" }))
    } catch (addError) {
      setError(addError.response?.data?.message || "Could not add this question.")
    } finally {
      setBusy(false)
    }
  }

  const removeQuestion = async (bank, question) => {
    try {
      const response = await deleteBankQuestion(bank._id, question._id)
      setBanks((current) => current.map((item) => item._id === bank._id ? response.bank : item))
    } catch (removeError) {
      setError(removeError.response?.data?.message || "Could not delete this question.")
    }
  }

  const removeBank = async (bank) => {
    if (!window.confirm(`Delete “${bank.name}” and its saved questions?`)) return
    try {
      await deleteQuestionBank(bank._id)
      setBanks((current) => current.filter((item) => item._id !== bank._id))
    } catch (removeError) {
      setError(removeError.response?.data?.message || "Could not delete this bank.")
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--neo-paper)] text-black">
      <Sidebar user={user} onNewInterview={() => navigate("/interview")} onLogout={logout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} moblieOpen={moblieOpen} setMoblieOpen={setMoblieOpen} />
      <main className={`min-w-0 flex-1 px-4 py-6 transition-all md:px-8 ${sidebarOpen ? "md:ml-[260px]" : "md:ml-[72px]"}`}>
        <div className="mx-auto max-w-5xl">
          <p className="inline-block border-2 border-black bg-sky-200 px-2 py-1 text-[10px] font-black uppercase tracking-widest">Practice library</p>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl">Question banks</h1>
          <p className="mt-1 max-w-2xl text-sm text-black/65">Save interview questions from reports or write your own. Your banks are private to your account.</p>

          <form onSubmit={createBank} className="mt-6 grid gap-3 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#171717] sm:grid-cols-2">
            <div className="sm:col-span-2"><h2 className="text-sm font-black">Create a question bank</h2></div>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} minLength={2} required placeholder="Bank name, e.g. Backend fundamentals" className="px-3 py-2 text-sm" />
            <input value={role} onChange={(event) => setRole(event.target.value)} maxLength={120} placeholder="Target role (optional)" className="px-3 py-2 text-sm" />
            <select value={type} onChange={(event) => setType(event.target.value)} className="px-3 py-2 text-sm"><option value="mixed">Mixed questions</option><option value="technical">Technical</option><option value="hr">HR</option></select>
            <button disabled={busy} className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"><FiPlus /> Create bank</button>
          </form>

          {error && <p role="alert" className="mt-4 border-2 border-black bg-red-100 p-3 text-sm font-bold text-red-950">{error}</p>}
          {loading ? <p className="mt-6 text-sm font-bold">Loading your banks...</p> : banks.length === 0 ? (
            <div className="mt-6 border-2 border-black bg-yellow-100 p-5"><FiBookmark /><p className="mt-2 text-sm font-extrabold">No question banks yet.</p><p className="mt-1 text-xs">Create one above, then add custom questions or save questions from an interview report.</p></div>
          ) : (
            <div className="mt-6 space-y-4">
              {banks.map((bank) => (
                <section key={bank._id} className="border-2 border-black bg-sky-100 p-4 shadow-[4px_4px_0_#171717]">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-black">{bank.name}</h2><p className="text-xs font-semibold text-black/60">{bank.role || "All roles"} · {bank.type} · {bank.questions.length} questions</p></div><button type="button" onClick={() => removeBank(bank)} className="px-3 py-1.5 text-xs">Delete bank</button></div>
                  <div className="mt-3 space-y-2">
                    {bank.questions.map((question, index) => <div key={question._id} className="flex items-start gap-2 border-2 border-black bg-white p-3"><p className="min-w-0 flex-1 text-sm"><span className="mr-2 font-black">{index + 1}.</span>{question.question}</p><button type="button" aria-label="Delete question" onClick={() => removeQuestion(bank, question)} className="flex h-8 w-8 shrink-0 items-center justify-center"><FiTrash2 size={14} /></button></div>)}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row"><textarea value={drafts[bank._id] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [bank._id]: event.target.value }))} maxLength={2000} rows={2} placeholder="Write a question to add to this bank" className="min-w-0 flex-1 px-3 py-2 text-sm" /><button type="button" disabled={busy || !drafts[bank._id]?.trim()} onClick={() => addQuestion(bank)} className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"><FiPlus /> Add question</button></div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default QuestionBanks
