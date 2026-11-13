import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { FiArrowLeft, FiCheck, FiChevronDown, FiClock, FiCopy, FiDownload, FiFileText, FiRefreshCw, FiZap } from "react-icons/fi"
import { GiTwoCoins } from "react-icons/gi"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { generateCoverLetter, getCoverLetterHistory } from "../apis/resume.api"
import { spendCoins } from "../apis/user.api"
import { DelayedSkeleton, Skeleton } from "../components/Skeleton"

const TONES = [
    { value: "professional", label: "Professional", desc: "Confident & polished" },
    { value: "enthusiastic", label: "Enthusiastic", desc: "Warm & energetic" },
    { value: "formal", label: "Formal", desc: "Traditional business style" },
]

const LENGTHS = [
    { value: "concise", label: "Concise", desc: "~150–200 words" },
    { value: "standard", label: "Standard", desc: "~250–320 words" },
    { value: "detailed", label: "Detailed", desc: "~350–420 words" },
]

const COST = 20

function SelectCard({ options, value, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
                    className={`flex flex-col items-start border-2 border-black px-3 py-2 text-left transition-colors min-w-[110px] ${value === opt.value ? "bg-sky-200 shadow-[2px_2px_0_#171717]" : "bg-white hover:bg-sky-50"}`}>
                    <span className="text-xs font-extrabold">{opt.label}</span>
                    <span className="text-[10px] font-medium text-black/55">{opt.desc}</span>
                </button>
            ))}
        </div>
    )
}

function formatDate(iso) {
    if (!iso) return ""
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

function HistoryPanel({ history, onLoad }) {
    const [open, setOpen] = useState(false)
    if (!history.length) return null
    return (
        <section className="border-2 border-black bg-white shadow-[4px_4px_0_#171717]">
            <button type="button" onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-black hover:bg-sky-50 transition-colors">
                <span className="flex items-center gap-2"><FiClock size={14} /> Past Cover Letters ({history.length})</span>
                <FiChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t-2 border-black">
                        <div className="divide-y divide-black/10 max-h-72 overflow-y-auto">
                            {history.map((item, i) => (
                                <div key={i} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-sky-50 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-xs font-extrabold truncate">{item.subject || "Cover Letter"}</p>
                                        <p className="text-[10px] font-medium text-black/55 mt-0.5">
                                            {[item.role, item.company].filter(Boolean).join(" @ ") || "No role specified"}
                                            {" · "}{item.tone} · {item.length}
                                        </p>
                                        <p className="text-[10px] text-black/35">{formatDate(item.createdAt)}</p>
                                    </div>
                                    <button type="button" onClick={() => onLoad(item)}
                                        className="shrink-0 border-2 border-black bg-sky-100 px-2.5 py-1 text-[10px] font-extrabold hover:bg-sky-200 transition-colors">
                                        Load
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}

function CoverLetter({ user, setUser }) {
    const navigate = useNavigate()
    const storedResume = useSelector((s) => s.resume.resume)

    const [useStored, setUseStored] = useState(!!storedResume?.extractedText)
    const [resumeText, setResumeText] = useState("")
    const [jobDescription, setJobDescription] = useState("")
    const [company, setCompany] = useState("")
    const [role, setRole] = useState("")
    const [tone, setTone] = useState("professional")
    const [length, setLength] = useState("standard")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [result, setResult] = useState(null)
    const [copied, setCopied] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [history, setHistory] = useState([])

    useEffect(() => {
        getCoverLetterHistory().then((res) => { if (res?.success) setHistory(res.data || []) }).catch(() => {})
    }, [])

    const canGenerate = jobDescription.trim().length >= 40 &&
        (useStored ? !!storedResume?.extractedText : resumeText.trim().length >= 40)

    const generate = async () => {
        if (!canGenerate || loading) return

        // Pre-check coins
        if ((user?.interviewCoin ?? 0) < COST) {
            setError(`You need ${COST} coins to generate a cover letter. You have ${user?.interviewCoin ?? 0}.`)
            return
        }

        setLoading(true)
        setError("")
        setResult(null)

        try {
            // Deduct coins BEFORE calling the AI
            const coinRes = await spendCoins({ coins: COST, action: "cover-letter" })
            setUser((prev) => ({ ...prev, interviewCoin: coinRes.interviewCoin }))

            const payload = {
                jobDescription: jobDescription.trim(),
                company: company.trim(),
                role: role.trim(),
                tone,
                length,
                ...(!useStored && { resumeText: resumeText.trim() }),
            }
            const res = await generateCoverLetter(payload)
            if (!res?.success) throw new Error(res?.message || "Generation failed.")
            setResult(res.data)
            // Prepend to local history
            setHistory((prev) => [{
                coverLetter: res.data.coverLetter,
                subject: res.data.subject,
                role: role.trim(),
                company: company.trim(),
                tone,
                length,
                createdAt: new Date().toISOString(),
            }, ...prev].slice(0, 20))
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Could not generate the cover letter. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const loadFromHistory = (item) => {
        setResult({ coverLetter: item.coverLetter, subject: item.subject })
        if (item.role) setRole(item.role)
        if (item.company) setCompany(item.company)
        if (item.tone) setTone(item.tone)
        if (item.length) setLength(item.length)
    }

    const copy = async () => {
        if (!result?.coverLetter) return
        await navigator.clipboard.writeText(result.coverLetter)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const download = () => {
        if (!result?.coverLetter) return
        const blob = new Blob([result.coverLetter], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `cover-letter-${role || "application"}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-screen bg-[var(--neo-paper)] text-black">
            <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="sticky top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
                        <FiArrowLeft size={15} />
                        <span className="text-sm font-extrabold">Intervue AI</span>
                        <span className="hidden border-2 border-black bg-sky-200 px-2 py-0.5 text-[10px] font-bold sm:block">COVER LETTER</span>
                    </button>
                    <div className="flex items-center gap-3">
                        {/* Coin badge */}
                        <div className="flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1.5">
                            <GiTwoCoins size={14} className="text-sky-800" />
                            <span className="text-xs font-extrabold">{user?.interviewCoin ?? 0}</span>
                            <span className="text-[10px] text-black/45 font-medium">coins · {COST} per letter</span>
                        </div>
                        {result && (
                            <>
                                <button onClick={copy} className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold hover:bg-sky-50 transition-colors">
                                    {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                                <button onClick={download} className="flex items-center gap-1.5 border-2 border-black bg-sky-200 px-3 py-1.5 text-xs font-extrabold hover:bg-sky-300 transition-colors">
                                    <FiDownload size={13} /> Download
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.nav>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
                <header className="mb-7">
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-sky-900">AI-powered</p>
                    <h1 className="text-3xl font-black sm:text-4xl">Cover Letter Generator</h1>
                    <p className="mt-2 max-w-xl text-sm font-medium text-black/65">
                        Paste a job description and get a tailored cover letter in seconds — grounded in your real resume, never invented.
                    </p>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    {/* Left: Inputs */}
                    <div className="space-y-5">
                        {/* Resume source */}
                        <section className="border-2 border-black bg-white p-4 shadow-[4px_4px_0_#171717] sm:p-5">
                            <h2 className="mb-3 text-sm font-black">1. Your Resume</h2>
                            <div className="flex gap-2 mb-4">
                                <button type="button" onClick={() => setUseStored(true)} disabled={!storedResume?.extractedText}
                                    className={`flex-1 border-2 border-black py-2 text-xs font-extrabold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${useStored ? "bg-sky-200" : "bg-white hover:bg-sky-50"}`}>
                                    Use uploaded resume
                                </button>
                                <button type="button" onClick={() => setUseStored(false)}
                                    className={`flex-1 border-2 border-black py-2 text-xs font-extrabold transition-colors ${!useStored ? "bg-sky-200" : "bg-white hover:bg-sky-50"}`}>
                                    Paste resume text
                                </button>
                            </div>
                            {useStored ? (
                                <div className="flex items-center gap-3 border-2 border-black bg-sky-50 p-3">
                                    <FiFileText size={18} className="shrink-0 text-sky-900" />
                                    <div>
                                        <p className="text-xs font-extrabold text-sky-950">{storedResume?.name || "Uploaded resume"}</p>
                                        <p className="text-[10px] font-medium text-black/55">
                                            {storedResume?.suggestedRole && `Suggested role: ${storedResume.suggestedRole} · `}
                                            ATS score: {storedResume?.score ?? "—"}/100
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-black/60 mb-1">Paste your resume text</label>
                                    <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={8}
                                        placeholder="Paste your full resume text here — work experience, skills, education, projects..."
                                        className="w-full resize-y border-2 border-black/25 bg-white p-3 text-xs outline-none focus:border-black/60 transition-colors placeholder-black/30" />
                                    <p className="mt-1 text-[10px] text-black/40">{resumeText.length.toLocaleString()} / 14,000 characters</p>
                                </div>
                            )}
                        </section>

                        {/* Job details */}
                        <section className="border-2 border-black bg-white p-4 shadow-[4px_4px_0_#171717] sm:p-5">
                            <h2 className="mb-3 text-sm font-black">2. Job Details</h2>
                            <div className="grid gap-3 sm:grid-cols-2 mb-3">
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-black/60 mb-1">Role title</label>
                                    <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={160} placeholder="e.g. Backend Engineer"
                                        className="w-full border-2 border-black/25 bg-white px-3 py-2 text-xs outline-none focus:border-black/60 transition-colors placeholder-black/30" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-black/60 mb-1">Company</label>
                                    <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} placeholder="e.g. Google"
                                        className="w-full border-2 border-black/25 bg-white px-3 py-2 text-xs outline-none focus:border-black/60 transition-colors placeholder-black/30" />
                                </div>
                            </div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-black/60 mb-1">
                                Job description <span className="text-red-600">*</span>
                            </label>
                            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                                rows={7} maxLength={18000}
                                placeholder="Paste the full job description including responsibilities, requirements, and preferred qualifications..."
                                className="w-full resize-y border-2 border-black/25 bg-white p-3 text-xs outline-none focus:border-black/60 transition-colors placeholder-black/30" />
                            <p className="mt-1 text-[10px] text-black/40">{jobDescription.length.toLocaleString()} / 18,000 · minimum 40 characters</p>
                        </section>

                        {/* Style options */}
                        <section className="border-2 border-black bg-white shadow-[4px_4px_0_#171717]">
                            <button type="button" onClick={() => setShowAdvanced((v) => !v)}
                                className="flex w-full items-center justify-between px-4 py-3 text-sm font-black hover:bg-sky-50 transition-colors">
                                <span>3. Style Options</span>
                                <FiChevronDown size={15} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                        className="overflow-hidden border-t-2 border-black">
                                        <div className="space-y-4 p-4">
                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/60 mb-2">Tone</p>
                                                <SelectCard options={TONES} value={tone} onChange={setTone} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/60 mb-2">Length</p>
                                                <SelectCard options={LENGTHS} value={length} onChange={setLength} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* History */}
                        <HistoryPanel history={history} onLoad={loadFromHistory} />

                        {error && <p role="alert" className="border-2 border-black bg-red-100 p-3 text-sm font-bold text-red-950">{error}</p>}

                        <button type="button" onClick={generate} disabled={!canGenerate || loading}
                            className="w-full border-2 border-black bg-sky-300 py-3 text-sm font-extrabold shadow-[4px_4px_0_#171717] hover:bg-sky-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loading ? (
                                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> Generating…</>
                            ) : (
                                <><FiZap size={15} /> Generate Cover Letter <span className="flex items-center gap-1 text-[11px] font-bold opacity-70"><GiTwoCoins size={12} />{COST} coins</span></>
                            )}
                        </button>
                    </div>

                    {/* Right: Output */}
                    <div>
                        <AnimatePresence mode="wait">
                            {!result && !loading && (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex min-h-[400px] flex-col items-center justify-center border-2 border-dashed border-black/20 bg-white p-8 text-center">
                                    <FiFileText size={36} className="mb-4 text-black/20" />
                                    <p className="text-sm font-extrabold text-black/40">Your cover letter will appear here</p>
                                    <p className="mt-1 text-xs font-medium text-black/30">Fill in the job details and click Generate</p>
                                    <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-black/35">
                                        <GiTwoCoins size={12} /> Costs {COST} coins per generation
                                    </p>
                                </motion.div>
                            )}

                            {loading && (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="min-h-[400px] border-2 border-black bg-sky-50 p-6 shadow-[4px_4px_0_#171717] sm:p-8">
                                    <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black/20 border-t-sky-600" />
                                    <DelayedSkeleton active={loading}><div aria-label="Cover letter preview loading" aria-busy="true" className="mx-auto mt-8 w-full max-w-lg space-y-3"><Skeleton className="mx-auto h-4 w-3/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-11/12" /><Skeleton className="h-3 w-3/4" /></div></DelayedSkeleton>
                                    <p className="text-sm font-extrabold text-sky-950">Writing your cover letter…</p>
                                    <p className="mt-1 text-xs font-medium text-black/50">Analyzing job requirements and matching your experience</p>
                                </motion.div>
                            )}

                            {result && !loading && (
                                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35 }} className="border-2 border-black bg-white shadow-[4px_4px_0_#171717]">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black bg-sky-100 px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-sky-950">Generated</p>
                                            <p className="text-sm font-extrabold text-black">{result.subject}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={copy} className="flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1.5 text-[10px] font-extrabold hover:bg-sky-50 transition-colors">
                                                {copied ? <FiCheck size={11} /> : <FiCopy size={11} />}
                                                {copied ? "Copied!" : "Copy"}
                                            </button>
                                            <button onClick={download} className="flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1.5 text-[10px] font-extrabold hover:bg-sky-50 transition-colors">
                                                <FiDownload size={11} /> .txt
                                            </button>
                                            <button onClick={generate} disabled={loading || (user?.interviewCoin ?? 0) < COST}
                                                className="flex items-center gap-1.5 border-2 border-black bg-yellow-200 px-2.5 py-1.5 text-[10px] font-extrabold hover:bg-yellow-300 transition-colors disabled:opacity-40">
                                                <FiRefreshCw size={11} /> Regenerate
                                            </button>
                                        </div>
                                    </div>
                                    <pre className="whitespace-pre-wrap break-words p-5 font-sans text-sm leading-7 text-black">
                                        {result.coverLetter}
                                    </pre>
                                    <div className="border-t-2 border-black bg-yellow-50 px-4 py-3">
                                        <p className="text-[10px] font-semibold text-black/55">
                                            ⚠ Review all details before sending. The AI uses only facts from your resume but may occasionally misphrase or omit context.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default CoverLetter
