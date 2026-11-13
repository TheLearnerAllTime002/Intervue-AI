import { motion } from "motion/react"
import { FiArrowLeft, FiArrowRight, FiBriefcase, FiCheck, FiCheckCircle, FiFileText, FiUploadCloud } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { spendCoins } from '../../apis/user.api'
import api from '../../utils/axios'
import { setResume } from '../../redux/resumeSlice'
import { startInterview } from '../../apis/interview.api'
import { formatFileSize, validateResumeFile } from '../../utils/validateResumeFile'
import { Skeleton, useDelayedLoading } from '../Skeleton'
function Step1setup({ user, setUser }) {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { resume } = useSelector((state) => state.resume)
    const [role, setRole] = useState("");
    const [type, setType] = useState("technical");
    const [difficultyMode, setDifficultyMode] = useState("intermediate");
    const [companyName, setCompanyName] = useState("");
    const [useResume, setUseResume] = useState(null)
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [fileError, setFileError] = useState("")
    const [uploadError, setUploadError] = useState("")
    const [uploadNotice, setUploadNotice] = useState("")
    const [uploadProgress, setUploadProgress] = useState(0)
    const [analysisStarted, setAnalysisStarted] = useState(false)
    const [starting, setStarting] = useState(false)
    const [startError, setStartError] = useState("")
    const showStartSkeleton = useDelayedLoading(starting)

    const useResumeEnabled = useResume === null ? !!resume : useResume

    const selectResumeFile = async (selectedFile) => {
        const validationError = await validateResumeFile(selectedFile)
        setFileError(validationError)
        setUploadError("")
        setUploadNotice("")
        setFile(validationError ? null : selectedFile)
    }

    const uploadResume = async () => {
        if (!file || uploading) return
        setUploading(true)
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
            setUploading(false)
            setFile(null)
            setFileError("")
            try {
                const coinResponse = await spendCoins({ coins: 10, action: "resume-scorer" })
                setUser((prev) => ({ ...prev, interviewCoin: coinResponse?.interviewCoin }))
            } catch (coinError) {
                console.error("Resume uploaded but coins could not be deducted:", coinError)
                setUploadNotice("Resume analyzed successfully, but coin deduction failed. Please contact support.")
            }
        } catch (error) {
            console.error("Resume upload failed:", error)
            setUploadError(error.response?.data?.message || error.message || "Upload failed. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    const start = async () => {
        if (starting) return
        if (!role.trim()) {
            setStartError("Enter a target role before starting the interview.")
            return
        }
        if (difficultyMode === "company-specific" && !companyName.trim()) {
            setStartError("Enter a target company for a company-specific interview.")
            return
        }
        if ((user?.interviewCoin ?? 0) < 50) {
            setStartError("You need at least 50 coins to start an interview. Purchase more coins from Billing.")
            return
        }
        setStarting(true)
        setStartError("")
        try {
            const coinResponse = await spendCoins({ coins: 50, action: "start-interview" })
            setUser((prev) => ({ ...prev, interviewCoin: coinResponse?.interviewCoin }))

            const response = await startInterview({ role, type, difficultyMode, companyName, useResume: useResumeEnabled, resume })
            if (!response?.success || !response.interviewId) {
                throw new Error(response?.message || "The interview could not be started. Please try again.")
            }
            navigate(`/interview/${response.interviewId}`)
        } catch (error) {
            console.error("Could not start interview:", error)
            setStartError(error.response?.data?.message || error.message || "Could not start the interview. Please try again.")
        } finally {
            setStarting(false)
        }
    }

    return (
        <div className='min-h-screen bg-white flex items-center justify-center p-3 sm:p-5'>
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className='w-full max-w-4xl bg-[#0E1016] border border-white/10 rounded-2xl sm:rounded-[24px] overflow-hidden grid lg:grid-cols-[40%_60%] shadow-[0_0_60px_rgba(255,255,255,.03)]'>

                {/* left */}

                <div className='p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-start gap-4'>

                    <div>
                        <div onClick={() => navigate("/dashboard")} className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 cursor-pointer'>
                            <FiArrowLeft size={12} />
                            <span className='text-xs text-zinc-300'>Back</span>
                        </div>
                        <h2 className='mt-4 text-xl sm:text-2xl font-bold text-white leading-snug'>
                            WelCome back,<br />
                            {user?.name}
                        </h2>

                        <p className='mt-2 text-xs sm:text-sm leading-6 text-zinc-400'>
                            Practice realistic AI interviews, receive instant feedback,
                            and improve before your next job interview.
                        </p>
                    </div>

                    <div className='space-y-2 sm:space-y-3'>
                        {[
                            "Personalized AI Questions",
                            "Resume Based Interview",
                            "Detailed Performance Report",
                            "Real Interview Experience",
                        ].map((item, index) => (
                            <motion.div key={index} whileHover={{ x: 4 }} className='flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3'>
                                <div className='w-7 h-7 shrink-0 rounded-lg bg-white flex items-center justify-center'><FiCheck className='text-black' size={13} /></div>
                                <span className='text-xs sm:text-sm text-zinc-300'>{item}</span>

                            </motion.div>
                        ))

                        }
                    </div>

                </div>

                {/* right */}
                <div className='p-5 sm:p-7 flex flex-col'>
                    <div>
                        <h2 className='text-lg sm:text-xl font-semibold text-white'>
                            Start Interview
                        </h2>
                        <p className='mt-1 text-xs text-zinc-500'>
                            Configure your interview preferences.
                        </p>
                    </div>

                    <div className='mt-5 flex-1 space-y-4 overflow-y-auto'>

                        {/* role */}
                        <div>
                            <label className='text-xs font-medium text-zinc-400'>Target Role</label>
                            <div className='mt-1.5 relative'>
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <input type="text"
                                    onChange={(e) => setRole(e.target.value)}
                                    value={role}
                                    placeholder='Backend Developer'
                                    className='w-full h-11 rounded-xl bg-[#17181E] border border-white/10 pl-10 pr-4 text-sm text-white outline-none focus:border-white/30 transition' />
                            </div>
                        </div>

                        {/* type */}

                        <div>
                            <label className='text-xs font-medium text-zinc-400'>Interview Type</label>
                            <div className='mt-1.5 flex rounded-xl bg-[#17181E] p-1 border border-white/10'>
                                {
                                    ["technical", "hr"].map((item) => (
                                        <button type="button" key={item}
                                            onClick={() => setType(item)}
                                            className={`flex-1 h-9 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all ${type === item ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                                                }`} >
                                            {item}
                                        </button>
                                    ))
                                }

                            </div>
                        </div>

                        <div>
                            <label className='text-xs font-medium text-zinc-400'>Interview Difficulty</label>
                            <p className='mt-1 text-[10px] text-zinc-500'>Choose the depth and style of questions.</p>
                            <div className='mt-2 grid grid-cols-2 gap-2'>
                                {[
                                    { value: "beginner", label: "Beginner", description: "Core concepts and guided questions" },
                                    { value: "intermediate", label: "Intermediate", description: "Typical role-level interview" },
                                    { value: "advanced", label: "Advanced", description: "Deeper trade-offs and scenarios" },
                                    { value: "company-specific", label: "Company-specific", description: "Adapted to a target employer" },
                                ].map((mode) => (
                                    <button
                                        key={mode.value}
                                        type='button'
                                        aria-pressed={difficultyMode === mode.value}
                                        onClick={() => setDifficultyMode(mode.value)}
                                        className='interview-difficulty-option min-h-[62px] p-2 text-left'
                                    >
                                        <span className='block text-xs font-black'>{mode.label}</span>
                                        <span className='mt-1 block text-[9px] font-medium leading-4'>{mode.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {difficultyMode === "company-specific" && (
                            <div>
                                <label htmlFor='interview-company' className='text-xs font-medium text-zinc-400'>Target Company</label>
                                <input
                                    id='interview-company'
                                    value={companyName}
                                    onChange={(event) => setCompanyName(event.target.value)}
                                    maxLength={120}
                                    placeholder='Enter a company name'
                                    className='mt-1.5 h-11 w-full rounded-xl bg-[#17181E] px-4 text-sm text-white'
                                />
                            </div>
                        )}

                        {/* resume toggle */}

                        <div className='rounded-xl border border-white/10 bg-[#17181E] p-4'>
                            <div className='flex items-center justify-between '>
                                <div>
                                    <h2 className='text-sm font-medium text-white'>Use Resume</h2>
                                    <p className='mt-0.5 text-xs text-zinc-500'>
                                        AI will personalize questions using your resume.
                                    </p>
                                </div>
                                <button type="button" aria-pressed={useResumeEnabled} onClick={() => setUseResume(!useResumeEnabled)} className={`relative shrink-0 w-12 h-7 rounded-full transition ${useResumeEnabled ? "bg-white" : "bg-zinc-700"}`}>
                                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-black transition-all ${useResumeEnabled ? "left-5.5" : "left-0.5"}`} />
                                </button>


                            </div>

                        </div>


                        {resume && useResumeEnabled && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}

                                className='rounded-lg border-2 border-black bg-sky-100 p-4'>
                                <div className='flex items-center gap-3'>

                                    <div className='w-9 h-9 shrink-0 rounded-lg border-2 border-black bg-white flex items-center justify-center'>
                                        <FiFileText size={15} className='text-sky-950' />
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <h4 className='text-sm font-extrabold text-black'>Resume Ready <span className='text-sky-950'>({resume?.suggestedRole})</span></h4>
                                        <p className='text-xs font-medium text-black/75'>
                                            Resume detected successfully.
                                        </p>
                                    </div>
                                    <FiCheckCircle size={20} className='text-emerald-950 shrink-0' />

                                </div>

                            </motion.div>
                        )}

                        {
                            useResumeEnabled && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className='rounded-xl border-2 border-dashed border-white/10 bg-[#17181E] p-4'>

                                    <label className='cursor-pointer flex flex-col items-center'>
                                        <div className='w-11 h-11 rounded-xl bg-white flex items-center justify-center'><FiUploadCloud size={20} className='text-black' /></div>
                                        <h3 className='mt-3 text-sm font-semibold text-white'>Upload Resume</h3>
                                        <p className='mt-1 text-xs text-zinc-500 text-center'>
                                            {resume
                                                ? "Resume detected. Upload a new resume anytime to update your interview questions."
                                                : "Upload your resume to generate personalized interview questions."
                                            }
                                        </p>
                                        <input type="file" className='hidden' accept='.pdf,application/pdf' disabled={uploading}
                                            onChange={(e) => { selectResumeFile(e.target.files?.[0]); e.target.value = "" }} />

                                    </label>

                                    {file && (
                                        <div className='mt-4'>
                                            <div className='rounded-lg bg-black/20 border border-white/10 p-2.5'>
                                                <p className='text-xs text-zinc-300 truncate'>{file.name}</p>
                                                <p className='mt-1 text-[10px] text-zinc-400'>{formatFileSize(file.size)} · PDF</p>
                                            </div>

                                            <button
                                                onClick={uploadResume}
                                                disabled={uploading}
                                                className='mt-3 w-full h-10 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition disabled:opacity-60'>
                                                {uploading ? "Uploading..." : "Upload"}
                                            </button>



                                        </div>
                                    )}

                                    {fileError && <p role="alert" className="mt-2 border-2 border-red-900 bg-red-100 p-2 text-xs font-bold text-red-950">{fileError}</p>}
                                    {uploading && (
                                        <div className="mt-3 rounded-lg border-2 border-black bg-white p-3" aria-live="polite">
                                            <div className="flex justify-between text-xs font-bold"><span>{analysisStarted ? "Analyzing resume..." : "Uploading PDF..."}</span><span>{uploadProgress}%</span></div>
                                            <div role="progressbar" aria-label="Resume upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress} className="mt-2 h-3 border-2 border-black bg-white"><div className="h-full bg-sky-400 transition-[width]" style={{ width: `${uploadProgress}%` }} /></div>
                                            {analysisStarted && <p className="mt-2 animate-pulse text-[10px] font-semibold text-sky-950">Upload complete. Extracting and analyzing resume content.</p>}
                                        </div>
                                    )}
                                    {uploadError && <p role="alert" className="mt-2 border-2 border-red-900 bg-red-100 p-2 text-xs font-bold text-red-950">{uploadError}</p>}
                                    {uploadNotice && <p role="status" className="mt-2 border-2 border-black bg-yellow-100 p-2 text-xs font-bold">{uploadNotice}</p>}

                                </motion.div>
                            )
                        }
                    </div>

                    <motion.button
                    onClick={start}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!role.trim() || (difficultyMode === "company-specific" && !companyName.trim()) || starting || (useResumeEnabled && !resume)}
                        className='mt-5 h-12 rounded-xl bg-white text-black text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition'>
                        {starting ? "Starting Interview..." : (
                            <>Start Interview <FiArrowRight size={15} /></>
                        )}

                    </motion.button>
                    {showStartSkeleton && <div aria-label="Preparing interview" aria-busy="true" className="mt-4 space-y-2 border-2 border-black bg-white p-3"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>}
                    {startError && <p role="alert" className='mt-3 text-xs font-bold text-red-800'>{startError}</p>}

                </div>


            </motion.div>


        </div>
    )
}

export default Step1setup
