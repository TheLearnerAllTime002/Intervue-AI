import { useEffect } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getInterview } from '../apis/interview.api'
import Step2interview from '../components/interview/Step2interview'
import { PageSkeleton } from '../components/Skeleton'

function InterviewPage({user}) {
    const {id} = useParams()
    const [loading , setLoading] = useState(true)
    const [interview,setInterview] = useState(null)
    const [loadError, setLoadError] = useState("")
    const navigate = useNavigate()

    useEffect(()=>{
        const fetchInterview = async () => {
            try {
                const response = await getInterview(id)
                const data = response?.interview
                if (!data) {
                    throw new Error(response?.message || "Interview details could not be loaded.")
                }
                if(data.status === "completed"){
                    navigate(`/interview/${id}/report`, { replace: true });
                    return;
                }
                if (!Array.isArray(data.questions) || !data.questions.length || !data.questions[data.currentQuestion]) {
                    throw new Error("This interview has no available question to continue.")
                }
                setInterview(data)
            } catch (error) {
                console.error("Could not load interview:", error)
                setLoadError(error.response?.data?.message || error.message || "Could not load the interview. Please try again.")
            } finally {
                setLoading(false)
            }
         }

         fetchInterview()

    },[id,navigate])

    if(loading){
        return <PageSkeleton variant="interview" />
    }
    if(loadError){
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--neo-paper)] p-6 text-center">
                <p role="alert" className="max-w-lg border-2 border-black bg-sky-100 p-4 text-sm font-bold shadow-[4px_4px_0_#171717]">{loadError}</p>
                <button onClick={() => navigate("/interview")} className="neo-blue-surface px-4 py-2 text-sm">Back to interview setup</button>
            </div>
        )
    }
    if(!interview) return null
    
    return (
    <Step2interview 
    interviewData={{
        interviewId: interview._id,
        currentQuestion: interview.currentQuestion,
        totalQuestions: interview.questions.length,
        question: interview.questions[interview.currentQuestion],
        difficultyMode: interview.difficultyMode || "intermediate",
        companyName: interview.companyName || "",
    }} user={user}    />
  )
}

export default InterviewPage
