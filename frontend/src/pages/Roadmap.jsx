import { AnimatePresence, motion } from "motion/react"
import { FiCheck, FiChevronDown, FiClock, FiFileText, FiSend, FiX, FiZap } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { BsRocketTakeoff } from "react-icons/bs";
import { spendCoins } from '../apis/user.api'
import api from '../utils/axios'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import RoadmapResult from '../components/roadmap/RoadmapResult'
import { ListSkeleton, Skeleton, useDelayedLoading } from '../components/Skeleton'
const PACKAGE_OPTIONS = ["10 LPA", "15 LPA", "20 LPA", "30 LPA", "40 LPA"];
function Roadmap({ user, setUser }) {
    const navigate = useNavigate()
    const [historyOpen, setHistoryOpen] = useState(false);
    const [roadmap, setRoadmap] = useState(null);
    const [role, setRole] = useState("");
    const [targetPackage, setTargetPackage] = useState(PACKAGE_OPTIONS[2]); // default "20 LPA"
    const [packageOpen, setPackageOpen] = useState(false);
    const [useResume, setUseResume] = useState(false);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState("");
    const showRoadmapSkeleton = useDelayedLoading(loading)

    const { resume } = useSelector((state) => state.resume)

    const getAllRoadmaps = async () => {
            setHistoryLoading(true)
            try {
                const response = await api.get("/api/roadmap/all")
                console.log(response.data)
                setHistory(response.data.data)
                setHistoryLoading(false)
            } catch (error) {
                console.error("Could not load roadmap history:", error)
                setHistoryLoading(false)
            }
        }

    useEffect(() => {
        getAllRoadmaps()
    }, [])


    const getRoadmapById = async (id) => {
        try {
            const response = await api.get(`/api/roadmap/${id}`)
            console.log(response.data)
            setRoadmap(response.data.data)
        } catch (error) {
            console.log(error)
        }
    }


    const handleGenerate = async () => {
        if (!role.trim() || loading) return;
        if ((user?.interviewCoin ?? 0) < 20) {
            setError("You need at least 20 coins to generate a roadmap. Purchase more from Billing.")
            return
        }
        setLoading(true);
        setError("");
        try {
            const coinResponse = await spendCoins({ coins: 20, action: "roadmap-builder" })
            setUser((prev) => ({ ...prev, interviewCoin: coinResponse?.interviewCoin }))

            const response = await api.post("/api/roadmap/generate", {
                role: role.trim(),
                targetPackage,
                useResume,
                resume
            })
            setRoadmap(response.data.data)
            getAllRoadmaps()
        } catch (error) {
            console.error("Failed to generate roadmap:", error);
            setError(error.response?.data?.message || "Something went wrong while generating your roadmap. Please try again.")
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className='min-h-screen bg-white text-[#0A0A0A] flex flex-col'>
            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className='sticky top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]'>
                <div className='mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6'>
                    <div onClick={() => navigate("/dashboard")}
                        className='flex cursor-pointer items-center gap-1.5'>
                        <span className='text-sm font-extrabold sm:text-base text-[#0A0A0A]'>Intervue AI</span>
                        <span className='hidden border-2 border-black bg-sky-200 px-2 py-0.5 text-[10px] font-bold sm:block'>ROADMAP GENERATOR</span>
                    </div>

                    <button onClick={() => setHistoryOpen(!historyOpen)} className='neo-blue-surface flex h-9 items-center justify-center gap-2 px-3 text-xs'>
                        <FiClock />
                        <span className="hidden sm:inline">History</span>
                    </button>

                </div>

            </motion.nav>

            <main className='flex-1 overflow-y-auto pb-32 sm:pb-36 pt-5 sm:pt-8'>
                <div className='max-w-5xl mx-auto px-4 sm:px-6'>
                    <AnimatePresence mode='wait'>
                        {!roadmap ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.4 }}
                                className='mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center rounded-lg border-2 border-black bg-sky-100 p-6 text-left shadow-[5px_5px_0_#171717] sm:p-10'>
                                <div className='mb-5 flex h-14 w-14 items-center justify-center border-2 border-black bg-sky-300 text-2xl shadow-[3px_3px_0_#171717]'>
                                    <BsRocketTakeoff className='text-sky-950' />
                                </div>

                                <p className='mb-2 border-2 border-black bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest'>Personalized career plan</p>
                                <h1 className='mb-3 text-3xl font-black sm:text-4xl'>Plan your next career move.</h1>

                                <p className='max-w-xl text-sm font-semibold text-black/70'>Choose a role and target salary. Intervue AI will create a practical learning path with topics, milestones, and a suggested timeline.</p>

                                {error && <p className="mt-4 text-xs text-red-500 max-w-xs sm:max-w-md">{error}</p>}

                                <div className='mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 w-full max-w-2xl'>
                                    {
                                        ["Frontend Dev", "Backend Eng", "ML Engineer"].map((r) => (
                                            <motion.button
                                                key={r}
                                                onClick={() => setRole(r)}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.97 }}
                                                className='neo-blue-surface relative overflow-hidden py-3 px-3 text-sm'>
                                                <div className='absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none' />
                                                <span className='relative'>{r}</span>

                                            </motion.button>
                                        ))
                                    }
                                </div>

                            </motion.div>
                        ) : (
                            <RoadmapResult
                            roadmap={roadmap}
                            onClear={()=>setRoadmap(null)}
                            
                            />

                        )}


                    </AnimatePresence>
                    {loading && showRoadmapSkeleton && <section aria-label="Generating roadmap" aria-busy="true" className="mx-auto mt-6 max-w-3xl space-y-4 border-2 border-black bg-white p-5 shadow-[4px_4px_0_#171717] sm:p-7"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-4 w-4/5" /></section>}
                </div>

            </main>

            <div className='fixed bottom-0 left-0 right-0 z-30 border-t-2 border-black bg-[var(--neo-paper)] px-3 py-3 sm:px-4'>
                <div className='max-w-5xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className='relative overflow-visible flex flex-wrap items-center gap-2 border-2 border-black bg-sky-100 p-2 shadow-[4px_4px_0_#171717] sm:flex-nowrap'>

                        <input
                            type='text'
                            placeholder='Backend Developer'
                            onChange={(e) => setRole(e.target.value)}
                            value={role}
                            className='relative min-w-[140px] flex-1 text-sm text-black placeholder-black/45 outline-none px-3 py-2' />

                        <div className='relative'>
                            <motion.button
                                type='button'
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setPackageOpen(!packageOpen)}
                                className='neo-blue-surface relative flex items-center gap-1 text-xs px-2.5 py-2 whitespace-nowrap'>
                                {targetPackage}
                                <FiChevronDown size={11} className={`transition-transform ${packageOpen ? "rotate-180" : ""}`} />


                            </motion.button>

                            <AnimatePresence>
                                {packageOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className='absolute bottom-full mb-4 right-0 w-28 rounded-lg overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0_#171717] z-10'>
                                        {
                                            PACKAGE_OPTIONS.map((pkg) => (
                                                <button key={pkg}
                                                    onClick={() => {
                                                        setTargetPackage(pkg);
                                                        setPackageOpen(false)
                                                    }}
                                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${pkg === targetPackage
                                                        ? "neo-blue-surface"
                                                        : "bg-white text-black hover:bg-sky-100"
                                                        }`}>
                                                    {pkg}

                                                </button>
                                            ))
                                        }

                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            type='button'
                            onClick={() => setUseResume(!useResume)}
                                className={`flex items-center text-xs gap-1 px-2 py-2 ${useResume
                                ? "neo-blue-surface"
                                : "bg-white text-black"
                                }`}>
                            {useResume ? (
                                <>
                                    <FiCheck size={12} />
                                    Added
                                </>
                            ) : (
                                <>
                                    <FiFileText size={12} />
                                    Resume
                                </>
                            )}

                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={loading || !role.trim()}
                            onClick={handleGenerate}
                            className='neo-blue-surface relative flex items-center gap-1.5 text-xs px-3 sm:px-4 py-2 whitespace-nowrap'>
                            {loading ? (
                                <>
                                    <motion.span
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="inline-block"
                                    >
                                        <FiZap size={12} />
                                    </motion.span>
                                    <span className="hidden sm:inline">Generating…</span>
                                </>
                            ) : (
                                <>
                                    <FiSend size={12} />
                                    <span className="hidden sm:inline">Generate</span>
                                </>
                            )}

                        </motion.button>


                    </motion.div>

                </div>
            </div>

            <AnimatePresence>
                {
                    historyOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setHistoryOpen(false)}
                                className='fixed inset-0 z-40 bg-black/20 backdrop-blur-sm' />

                            <motion.aside
                                initial={{ x: 320 }}
                                animate={{ x: 0 }}
                                exit={{ x: 320 }}
                                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                                className='fixed right-0 top-0 bottom-0 z-50 w-[300px] sm:w-[340px] max-w-[90vw] bg-[var(--neo-paper)] border-l-2 border-black flex flex-col overflow-y-auto shadow-[-5px_0_0_#171717]'>
                                <div className='flex items-center justify-between px-4 py-4 border-b-2 border-black sticky top-0 bg-sky-100'>
                                    <span className='text-sm font-black text-black'>Previous roadmaps</span>
                                    <button onClick={() => setHistoryOpen(false)} className='text-black/35 hover:text-[#0A0A0A] transition-colors'><FiX size={16} /></button>
                                </div>

                                <div className='flex flex-col gap-2 p-3'>
                                    {historyLoading ? (
                                        <ListSkeleton count={2} />
                                    )
                                        : history.length === 0 ?
                                            (
                                                <p className="text-xs text-black/35 text-center py-6">No roadmaps yet.</p>
                                            ) :
                                            (
                                                history.map((h, i) => (
                                                    <button key={i} onClick={()=>{
                                                        getRoadmapById(h._id);
                                                        setHistoryOpen(false)
                                                    }} className='neo-blue-surface relative overflow-hidden text-left p-4'>
                                                        <h3 className='text-black font-extrabold'>{h.title}</h3>
                                                        <div className='flex justify-between items-center my-1'>
                                                            <span className='text-sky-950 text-xs font-extrabold'>{h.targetPackage}</span>
                                                            <p className='text-xs font-semibold text-black/65'>{h.duration}</p>
                                                        </div>

                                                        <p className='text-xs font-medium text-black/60 mt-1'>
                                                        {new Date(h.createdAt).toLocaleDateString()}</p>

                                                    </button>
                                                ))
                                            )}
                                </div>


                            </motion.aside>

                        </>
                    )
                }
            </AnimatePresence>




        </div>
    )
}

export default Roadmap
