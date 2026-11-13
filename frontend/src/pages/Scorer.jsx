import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from "motion/react"
import { useState } from 'react'
import { FiAlertCircle, FiTrendingUp, FiUploadCloud, FiUser, FiZap } from 'react-icons/fi'
import api from '../utils/axios'
import { useDispatch, useSelector } from 'react-redux'
import { setResume } from '../redux/resumeSlice'
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"
import { spendCoins } from '../apis/user.api'
import JobMatch from '../components/JobMatch'
import { formatFileSize, validateResumeFile } from '../utils/validateResumeFile'
import { Skeleton, useDelayedLoading } from '../components/Skeleton'
const ScoreRing = ({ score }) => {
    const color = score >= 75 ? "#16a34a" : score >= 50 ? "#f59e0b" : "#ef4444";
    return (
        <div className='relative flex items-center justify-center'>
            <RadialBarChart
                width={110}
                height={110}
                cx={55}
                cy={55}
                innerRadius={40}
                outerRadius={53}
                startAngle={90}
                endAngle={-270}
                data={[{ value: score, fill: color }]}
                barSize={8}
            >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: "#e5e7eb" }} dataKey="value" cornerRadius={8} />

            </RadialBarChart>

            <div className='absolute flex  items-center'>
                <span className='text-lg font-black text-black leading-none'>{score}</span>
                <span className='text-[9px] font-bold text-black/60 mt-0.5'>/100</span>
            </div>

        </div>
    )
}

const Tag = ({ text, color }) => {
    const styles = {
        blue: "bg-sky-100 text-sky-900 border-sky-700",
        red: "bg-red-50    text-red-700    border-red-200",
        green: "bg-green-50  text-green-700  border-green-200",
        yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
    return (
        <div className={`text-[10px] px-1.5 py-1 rounded-md border font-medium ${styles[color]}`}>
            {text}

        </div>
    )
}

const Navbar = ({ label }) => {
    const navigate = useNavigate()
    return (
        <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className='sticky inset-x-0 top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]'>
            <div className='mx-auto flex h-14 max-w-7xl items-center justify-start px-4 sm:px-6'>
                <div onClick={() => navigate("/dashboard")}
                    className='flex cursor-pointer items-center gap-1.5'>
                    <span className='text-sm font-extrabold sm:text-base text-[#0A0A0A]'>Intervue AI</span>
                    <span className='hidden border-2 border-black bg-sky-200 px-2 py-0.5 text-[10px] font-bold sm:block'>{label}</span>
                </div>

            </div>

        </motion.nav>

    )
}

function Scorer({ user, setUser }) {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [fileError, setFileError] = useState("")
    const [uploadError, setUploadError] = useState("")
    const [uploadNotice, setUploadNotice] = useState("")
    const [uploadProgress, setUploadProgress] = useState(0)
    const [analysisStarted, setAnalysisStarted] = useState(false)
    const showAnalysisSkeleton = useDelayedLoading(loading && analysisStarted)
    const dispatch = useDispatch()
    const { resume } = useSelector((state) => state.resume)

    const selectResumeFile = async (selectedFile) => {
        const validationError = await validateResumeFile(selectedFile)
        setFileError(validationError)
        setUploadError("")
        setUploadNotice("")
        setFile(validationError ? null : selectedFile)
    }

    const uploadResume = async () => {
        if (!file || loading) return
        setLoading(true)
        setUploadError("")
        setUploadNotice("")
        setUploadProgress(0)
        setAnalysisStarted(false)
        try {
            const formData = new FormData()
            formData.append("resume", file)

            const response = await api.post("/api/resume/upload", formData, {
                onUploadProgress: (event) => {
                    if (!event.total) return
                    const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
                    setUploadProgress(percent)
                    if (percent >= 100) setAnalysisStarted(true)
                },
            })

            dispatch(setResume(response?.data?.data))
            setUploadProgress(100)
            setLoading(false)
            setFile(null)
            setFileError("")
            try {
                const coinResponse = await spendCoins({ coins: 10, action: "resume-scorer" })
                setUser((prev) => ({
                    ...prev, interviewCoin: coinResponse?.interviewCoin,
                }))
            } catch (error) {
                console.error("Resume uploaded but coins could not be deducted:", error)
                setUploadNotice("Resume analyzed successfully, but coin deduction failed. Please contact support.")
            }
        } catch (error) {
            console.error("Resume upload failed:", error)
            setUploadError(error.response?.data?.message || error.message || "Upload failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }
    // scorer section

    if (resume) return (
        <div className='min-h-screen bg-white text-[#0A0A0A]'>
            <Navbar label="Resume Scorer" />

            <section className='max-w-6xl mx-auto px-4 pt-8 sm:px-6 sm:pt-10 pb-10 space-y-5'>
                {/* header */}
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                        <p className='inline-block border-2 border-black bg-sky-200 px-2 py-0.5 text-[10px] font-extrabold tracking-widest uppercase mb-2'>Resume analysis</p>
                        <h2 className='text-2xl sm:text-3xl font-black'>{resume?.name}</h2>

                    </div>
                    <button onClick={() => dispatch(setResume(null))}
                        className='neo-blue-surface text-xs px-3 py-2'>Re-upload</button>
                </div>

                <JobMatch />

                {/* Score */}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className='neo-blue-surface relative overflow-hidden rounded-lg p-5 flex flex-col items-center gap-5 sm:flex-row'>
                    <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none' />

                    <div className='relative'>
                        <ScoreRing score={resume?.score} />

                    </div>
                    <div className='relative'>
                        <p className='text-black/65 text-xs font-bold mb-0.5'>Resume score</p>
                        <p className='text-xl sm:text-2xl font-black mb-1.5 text-black'>
                            {resume.score >= 75 ? "Strong" : resume.score >= 50 ? "Average" : "Needs Work"}
                        </p>
                        <div className='flex items-center gap-1.5'>
                            <FiUser className='text-sky-900 text-xs' />
                            <span className='text-xs font-bold text-sky-950'>{resume?.suggestedRole}</span>
                        </div>

                    </div>

                </motion.div >

                {/* Weaknesses & Strengths */}
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>


                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.07 }}
                        className='neo-yellow-surface relative overflow-hidden rounded-lg p-4 sm:flex-row'>
                        <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none' />
                        <div className='relative flex items-center gap-1.5 mb-2.5'>
                            <FiAlertCircle className='text-sky-900' size={14} />
                            <span className='text-sm font-extrabold text-black'>Strengths</span>
                        </div>



                        <div className='relative flex flex-wrap gap-1.5'>

                            {resume?.strengths?.map(s => <Tag key={s} text={s} color="green" />)}

                        </div>

                    </motion.div>


                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.07 }}
                        className='neo-blue-surface relative overflow-hidden rounded-lg p-4 sm:flex-row'>
                        <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none' />
                        <div className='relative flex items-center gap-1.5 mb-2.5'>
                            <FiAlertCircle className='text-sky-900' size={14} />
                            <span className='text-sm font-extrabold text-black'>Weaknesses</span>
                        </div>

                        <div className='relative flex flex-wrap gap-1.5'>

                            {resume?.weaknesses?.map(s => <Tag key={s} text={s} color="yellow" />)}

                        </div>

                    </motion.div>

                </div>

                {/* Missing Skills */}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.09 }}
                    className='neo-yellow-surface relative overflow-hidden rounded-lg p-4 sm:flex-row'>
                    <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none' />
                    <div className='relative flex items-center gap-1.5 mb-2.5'>
                        <FiZap className='text-sky-900' size={14} />
                        <span className='text-sm font-extrabold text-black'>Missing skills</span>
                    </div>

                    <div className='relative flex flex-wrap gap-1.5'>

                        {resume?.missingSkills?.map(s => <Tag key={s} text={s} color="red" />)}

                    </div>

                </motion.div>
                {/* Recommendations */}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.12 }}
                    className='neo-blue-surface relative overflow-hidden rounded-lg p-4 sm:flex-row'>
                    <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none' />
                    <div className='relative flex items-center gap-1.5 mb-2.5'>
                        <FiTrendingUp className='text-sky-900' size={14} />
                        <span className='text-sm font-extrabold text-black'>Recommendations</span>
                    </div>

                    <div className='relative flex flex-wrap gap-1.5'>

                        {resume?.recommendations?.map(s => <Tag key={s} text={s} color="blue" />)}

                    </div>

                </motion.div>



            </section>

        </div>
    )
    //upload section
    return (
        <div className='min-h-screen bg-white text-[#0A0A0A]'>
            <Navbar label="Resume Scorer" />


            <section className='flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8 sm:px-6'>

                <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className='relative w-full max-w-xl rounded-lg overflow-hidden neo-blue-surface p-5 sm:p-8'>
                    <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none' />

                    <p className='relative text-[10px] text-sky-950 font-extrabold tracking-widest uppercase mb-1.5'>Step 1 of 2</p>

                    <div className='relative w-full h-2 border-2 border-black bg-white mb-6'>
                        <div className='h-full bg-sky-400 w-1/2' /></div>

                    <h2 className='relative text-2xl font-black mb-1 text-black'>
                        Upload Your Resume
                    </h2>
                    <p className='relative text-black/65 text-sm mb-5'>
                        We'll score it and give you actionable feedback
                    </p>


                    <label className={`relative flex flex-col items-center justify-center w-full h-40 sm:h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-colors
              ${file
                            ? "border-sky-900 bg-sky-100"
                            : "border-black bg-white hover:bg-sky-50"
                        }`}>
                        <FiUploadCloud className={`text-4xl sm:text-5xl mb-2.5 ${file ? "text-sky-900" : "text-black/50"}`} />
                        <p className="text-sm font-extrabold text-black">
                            {file ? file.name : "Click or drag PDF here"}
                        </p>
                        <p className="text-xs font-medium text-black/60 mt-1">PDF only · Max 20 MB · Empty, renamed, or invalid PDFs are rejected</p>

                        <input type='file'
                            accept='.pdf,application/pdf'
                            className='hidden'
                            disabled={loading}
                            onChange={(e) => { selectResumeFile(e.target.files?.[0]); e.target.value = "" }}
                        />
                    </label>

                    {file && <p className="relative mt-2 text-xs font-bold text-sky-950">Selected: {file.name} · {formatFileSize(file.size)}</p>}
                    {fileError && <p role="alert" className="relative mt-2 border-2 border-red-900 bg-red-100 p-2 text-xs font-bold text-red-950">{fileError}</p>}

                    {loading && (
                        <div className="relative mt-4 border-2 border-black bg-white p-3" aria-live="polite">
                            <div className="flex justify-between text-xs font-bold"><span>{analysisStarted ? "Analyzing resume..." : "Uploading PDF..."}</span><span>{uploadProgress}%</span></div>
                            <div role="progressbar" aria-label="Resume upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress} className="mt-2 h-3 border-2 border-black bg-white"><div className="h-full bg-sky-400 transition-[width]" style={{ width: `${uploadProgress}%` }} /></div>
                            {analysisStarted && <p className="mt-2 animate-pulse text-[10px] font-semibold text-sky-950">Upload complete. Extracting and analyzing resume content.</p>}
                            {showAnalysisSkeleton && <div aria-label="Preparing resume analysis" aria-busy="true" className="mt-4 space-y-2 border-t border-black/15 pt-3"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /><Skeleton className="h-20 w-full" /></div>}
                        </div>
                    )}
                    {uploadError && <p role="alert" className="relative mt-3 border-2 border-red-900 bg-red-100 p-2 text-xs font-bold text-red-950">{uploadError}</p>}
                    {uploadNotice && <p role="status" className="relative mt-3 border-2 border-black bg-yellow-100 p-2 text-xs font-bold">{uploadNotice}</p>}

                    <motion.button
                        whileHover={{ scale: 1.07 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={uploadResume}
                        disabled={!file || loading} className='neo-blue-surface relative mt-5 w-full h-11 text-sm'>
                        {loading ? (analysisStarted ? "Analyzing resume..." : `Uploading ${uploadProgress}%`) : "Analyze Resume"}

                    </motion.button>



                </motion.div>
            </section>




        </div>
    )
}

export default Scorer
