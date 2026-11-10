import React, { useCallback, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import { motion } from "motion/react"
import { FiSidebar } from 'react-icons/fi'
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
function Dashboard({ user, setUser }) {
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
    <div className='bg-white min-h-screen text-[#0A0A0A] font-sans flex'>
      <Sidebar
        user={user}
        onNewInterview={() => navigate("/interview")}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        moblieOpen={moblieOpen}
        setMoblieOpen={setMoblieOpen}
      />

      <motion.main className={`flex-1 min-h-screen px-3 sm:px-4 md:px-6 py-4 md:py-6 transition-all duration-300 ${sidebarOpen ? "md:ml-[260px]" : "md:ml-[72px]"
        }`}>

        {/* top Area */}
        <div className='flex items-center justify-between mb-5 md:mb-6'>
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
              <p className='inline-block border-2 border-black bg-sky-200 px-2 py-0.5 text-[10px] md:text-xs font-extrabold uppercase tracking-wide mb-1'>Overview</p>

              <h2 className='text-lg md:text-xl font-bold text-[#0A0A0A]'>Hello, {user?.name?.split(" ")[0]} </h2>



            </motion.div>



          </div>
        </div>

        <div className='h-px bg-black/8 mb-5 md:mb-6' />

        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3'>

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

        <PracticeStreaks interviews={interviews} />
        <WeeklyGoal interviews={interviews} />
        <SkillRadarChart interviews={interviews} />

        <motion.div  
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
