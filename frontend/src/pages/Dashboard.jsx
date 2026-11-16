import React, { useCallback, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import { motion } from "motion/react"
import { FiSidebar, FiArrowUpRight, FiCheckCircle } from 'react-icons/fi'
import { useEffect } from 'react'
import { deleteInterview, getAllInterviews } from '../apis/interview.api'
import { signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'
import Statbox from '../components/Statbox'
import InterviewGraph from '../components/InterviewGraph'
import InterviewProgress from '../components/InterviewProgress'
import InterviewHistory from '../components/InterviewHistory'
import PracticeStreaks from '../components/PracticeStreaks'
import SkillRadarChart from '../components/SkillRadarChart'
import WeeklyGoal from '../components/WeeklyGoal'
import ProductTour from '../components/ProductTour'
import CareerNews from '../components/CareerNews'
import { AnimatePresence } from 'motion/react'
function Dashboard({ user, setUser }) {
  const [welcomeName, setWelcomeName] = useState(() => {
    const name = sessionStorage.getItem('intervue:welcome-toast')
    if (name) sessionStorage.removeItem('intervue:welcome-toast')
    return name
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [moblieOpen, setMoblieOpen] = useState(false)
  const [stats, setStats] = useState({

    totalInterviews: 0,

    totalQuestions: 0,

    completed: 0,

    averageScore: 0,

  });

  const [technicalData, setTechnicalData] = useState([]);

  const [hrData, setHrData] = useState([]);

  const [technicalCount, setTechnicalCount] = useState(0);

  const [hrCount, setHrCount] = useState(0);
  const [interviews, setInterviews] = useState([])
  const [historyError, setHistoryError] = useState("")
  const [loadingInterviews, setLoadingInterviews] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    if (!welcomeName) return undefined
    const timer = window.setTimeout(() => setWelcomeName(null), 4200)
    return () => window.clearTimeout(timer)
  }, [welcomeName])

  const fetchInterviews = useCallback(async () => {
      setLoadingInterviews(true)
      try {
        const response = await getAllInterviews()
        if (!response?.success) {
          setHistoryError("Interview history could not be loaded.")
          return
        }
        setInterviews(response.interviews || [])
        setStats(response.stats || {})
        setTechnicalData(response.technicalData || [])
        setHrData(response.hrData || [])
        setTechnicalCount(response.technicalCount || 0)
        setHrCount(response.hrCount || 0)
      } catch (error) {
        console.error("Could not load dashboard interview history:", error)
        setHistoryError("Interview history could not be loaded. Refresh the page to try again.")
      } finally {
        setLoadingInterviews(false)
      }
  }, [])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  const handleDeleteInterview = async (interview) => {
    await deleteInterview(interview._id)
    await fetchInterviews()
  }

  const handleLogout = async () => {
    try {
      await api.get("/api/auth/logout")
    } catch (error) {
      console.error("Failed to revoke server session:", error)
    } finally {
      // Always clear the local session so a failed network request cannot
      // leave the user stuck on the dashboard.
      setUser(null)
      await signOut(auth).catch((error) => {
        console.error("Failed to sign out of Firebase:", error)
      })
      navigate("/", { replace: true })
    }
  }



  return (
    <div className='bg-[#f6fbff] min-h-screen text-[#0A0A0A] font-sans flex'>
      <Sidebar
        user={user}
        onNewInterview={() => navigate("/interview")}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        moblieOpen={moblieOpen}
        setMoblieOpen={setMoblieOpen}
        onStartTour={() => window.dispatchEvent(new Event("intervue:start-product-tour"))}
      />
      <ProductTour />
      <AnimatePresence>
        {welcomeName && <motion.div initial={{ opacity: 0, y: -14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} role="status" className="fixed right-4 top-4 z-[65] flex items-center gap-3 rounded-2xl border-2 border-black bg-yellow-200 px-4 py-3 shadow-[4px_4px_0_#171717] sm:right-6 sm:top-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-sky-200 text-sky-950"><FiCheckCircle size={18} /></span>
          <span><span className="block text-[10px] font-extrabold uppercase tracking-widest text-black/55">Signed in successfully</span><span className="text-sm font-black">Welcome, {welcomeName}!</span></span>
        </motion.div>}
      </AnimatePresence>

      <motion.main className={`flex-1 min-h-screen px-3 sm:px-4 md:px-6 py-4 md:py-6 transition-all duration-300 ${sidebarOpen ? "md:ml-[260px]" : "md:ml-[72px]"
        }`}>

        <section className='relative mb-5 overflow-hidden rounded-3xl border-2 border-black bg-gradient-to-br from-sky-200 via-sky-100 to-yellow-100 p-5 shadow-[5px_5px_0_#171717] md:mb-6 md:p-7'>
          <div className='pointer-events-none absolute -right-8 -top-14 h-48 w-48 rounded-full border-[24px] border-yellow-200/80' />
          <div className='relative flex flex-wrap items-center justify-between gap-5'>
          <div className='flex items-center gap-2.5'>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMoblieOpen(true)}
              className='md:hidden text-black/40 hover:text-[#0A0A0A] transition-colors'>
              <FiSidebar size={17} />

            </motion.button>


            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className='mb-1 inline-flex rounded-full border border-sky-900/20 bg-white/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-sky-950'>Your interview workspace</p>

              <h2 className='text-2xl font-black tracking-tight text-[#0A0A0A] md:text-3xl'>Welcome back, {user?.name?.split(" ")[0] || 'there'}!</h2>
              <p className='mt-1 max-w-xl text-xs font-medium text-sky-950/75 md:text-sm'>Your next opportunity starts with a little practice. Keep your momentum going.</p>



            </motion.div>



          </div>
          <button type="button" onClick={() => navigate('/interview')} className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-yellow-300 px-4 py-3 text-sm font-extrabold shadow-[3px_3px_0_#171717] transition hover:-translate-y-0.5 hover:bg-yellow-200">Start an interview <FiArrowUpRight size={16} /></button>
          </div>
        </section>

        <div className='h-px bg-black/8 mb-5 md:mb-6' />

        <div data-tour="dashboard-stats" className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3'>

          <Statbox
            label="Total Interviews"

            value={stats?.totalInterviews}

            subHighlight="All Time"

            sub="Interviews Created"

            index={0}
          />

          <Statbox

            label="Questions Solved"

            value={stats?.totalQuestions}

            subHighlight="Answered"

            sub="Across All Interviews"

            index={1}

          />



          <Statbox

            label="Completed"

            value={stats?.completed}

            subHighlight={`${stats?.totalInterviews || 0} Total`}

            sub="Interviews Finished"

            index={2}

          />



          <Statbox

            label="Average Score"

            value={`${Math.round(stats?.averageScore || 0)}/100`}

            subHighlight="Completed Only"

            sub="Average Performance"

            index={3}

          />


        </div>

        <div data-tour="dashboard-insights"><PracticeStreaks interviews={interviews} />
        <WeeklyGoal interviews={interviews} />
        <SkillRadarChart interviews={interviews} /></div>

        <CareerNews />

        <motion.div data-tour="dashboard-history"
        initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          transition={{ duration: 0.4, delay: 0.3 }}

          className="mb-3 md:mb-4">

            <p className='inline-block border-2 border-black bg-sky-200 px-2 py-0.5 text-black text-[10px] font-extrabold uppercase tracking-widest mt-2.5 mb-1'>
            Performance</p>

            <h3 className='text-[#0A0A0A] font-bold text-sm md:text-base mb-3 md:mb-4'>Interview History</h3>

        </motion.div>

        

          <InterviewGraph
          technicalData={technicalData}
          technicalCount={technicalCount}
          hrData={hrData}
          hrCount={hrCount}
          />

          <InterviewProgress interviews={interviews} loading={loadingInterviews} />

          {historyError ? (
            <p role="alert" className="mt-7 border-2 border-black bg-yellow-100 p-4 text-sm font-bold text-black">{historyError}</p>
          ) : (
            <InterviewHistory
              interviews={interviews}
              loading={loadingInterviews}
              onOpenInterview={(interview) => navigate(interview.status === "completed" ? `/interview/${interview._id}/report` : `/interview/${interview._id}`)}
              onStartInterview={() => navigate("/interview")}
              onDeleteInterview={handleDeleteInterview}
            />
          )}
        

      </motion.main>



    </div>
  )
}

export default Dashboard
