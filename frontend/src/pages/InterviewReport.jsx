import { useEffect, useState } from 'react'
import Step3report from '../components/interview/Step3report'
import { useNavigate, useParams } from 'react-router-dom'
import { getInterview } from '../apis/interview.api'
import { PageSkeleton } from '../components/Skeleton'

function InterviewReport({user, setUser}) {
  const {id} = useParams()
    const [loading , setLoading] = useState(true)
    const [report,setReport] = useState(null)
    const [loadError, setLoadError] = useState("")
    const navigate = useNavigate()

    useEffect(()=>{
        const fetchReport = async () => {
          try {
            const response = await getInterview(id)
            const data = response?.interview
            if (!data) throw new Error(response?.message || "Interview report could not be loaded.")
            if(data.status !== "completed"){
              navigate(`/interview/${id}`, {replace: true})
              return
            }
            setReport(data)
          } catch (error) {
            console.error("Could not load interview report:", error)
            setLoadError(error.response?.data?.message || error.message || "Could not load the interview report. Please try again.")
          } finally {
            setLoading(false)
          }
         }

         fetchReport()

    },[id,navigate])

    if(loading){
        return <PageSkeleton />
    }
    if(loadError){
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--neo-paper)] p-6 text-center">
          <p role="alert" className="max-w-lg border-2 border-black bg-sky-100 p-4 text-sm font-bold shadow-[4px_4px_0_#171717]">{loadError}</p>
          <button onClick={() => navigate("/dashboard")} className="neo-blue-surface px-4 py-2 text-sm">Back to dashboard</button>
        </div>
      )
    }
    if(!report) return null


  return (
   <Step3report
   user={user}
   setUser={setUser}
   report={report}
   />
  )
}

export default InterviewReport
