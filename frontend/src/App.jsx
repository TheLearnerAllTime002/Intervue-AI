import { Routes , Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import { useCallback, useEffect, useState } from 'react'
import Scorer from './pages/Scorer'
import { getResume } from './apis/resume.api'
import { useDispatch } from 'react-redux'
import { setResume } from './redux/resumeSlice'
import ResumeBuilder from './pages/ResumeBuilder'
import InterviewStart from './pages/InterviewStart'
import InterviewPage from './pages/InterviewPage'
import InterviewReport from './pages/InterviewReport'
import Roadmap from './pages/Roadmap'
import Billing from './pages/Billing'
import Applications from './pages/Applications'
import Contact from './pages/Contact'
import QuestionBanks from './pages/QuestionBanks'
import CoverLetter from './pages/CoverLetter'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './utils/firebase'
import { restoreBackendSession } from './apis/user.api'

function App() {
  const [user,setUser]= useState(null)
  const [loading , setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [retryingSession, setRetryingSession] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    let active = true
    let authRevision = 0

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const revision = ++authRevision

      if (!firebaseUser) {
        if (active) {
          setUser(null)
          setAuthError(null)
          setLoading(false)
        }
        return
      }

      try {
        const result = await restoreBackendSession(firebaseUser)
        if (active && revision === authRevision) {
          const backendUser = result?.user ?? result?.data?.user

          if (!backendUser?.userId && !backendUser?._id) {
            throw new Error("Backend session returned no valid user.")
          }

          setUser(backendUser)
          setAuthError(null)
        }
      } catch (error) {
        console.error("Session restoration failed:", error)
        if (active && revision === authRevision) {
          setUser(null)
          setAuthError(error)
        }
      } finally {
        if (active && revision === authRevision) setLoading(false)
      }
    }, (error) => {
      console.error("Firebase auth state listener failed:", error.code || "unknown")
      if (active) {
        setAuthError(error)
        setLoading(false)
      }
    })

    return () => {
      active = false
      authRevision += 1
      unsubscribe()
    }
  }, [])

  const retrySessionRestore = useCallback(async () => {
    setRetryingSession(true)
    setAuthError(null)
    try {
      const result = await restoreBackendSession(auth.currentUser)
      setUser(result?.user ?? null)
    } catch (error) {
      console.error("Could not restore the backend session:", error.response?.status || error.code || "network error")
      setAuthError(error)
    } finally {
      setRetryingSession(false)
    }
  }, [])

  useEffect(() => {
    if (loading || !user) {
      if (!loading) dispatch(setResume(null))
      return
    }

    let active = true
    const getResumeData = async () => {
      const result = await getResume()
      if (active) dispatch(setResume(result?.data ?? null))
    }

    getResumeData()
    return () => { active = false }
  }, [dispatch, loading, user])


  if(loading){
    return(
      <div className="fixed top-0 left-0 w-full z-[9999]">
        <div className="h-1 bg-black animate-pulse w-full" />
      </div>
    )
  }

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6 text-center">
        <section className="max-w-md border-2 border-black bg-white p-8 shadow-[6px_6px_0_#171717]">
          <h1 className="text-2xl font-black">We couldn’t verify your session</h1>
          <p className="mt-3 text-sm leading-6">Your sign-in state is still available. Check your connection and try again.</p>
          <button type="button" onClick={retrySessionRestore} disabled={retryingSession} className="mt-6 border-2 border-black bg-yellow-300 px-5 py-3 font-bold disabled:opacity-60">
            {retryingSession ? "Checking session..." : "Retry"}
          </button>
        </section>
      </main>
    )
  }

  return (
   <>

   <Routes>
    <Route path='/' element={
      user ? <Navigate to="/dashboard" replace/> : <Home setUser={setUser}/>
      }/>

    <Route path='/contact' element={<Contact/>}/>

    <Route path='/dashboard' element={
      user ? <Dashboard user={user} setUser={setUser}/> 
      : <Navigate to="/" replace/> }/>

      <Route path='/scorer' element={
      user ? <Scorer user={user} setUser={setUser}/> 
      : <Navigate to="/" replace/> }/>

      <Route path='/resume' element={
      user ? <ResumeBuilder user={user} setUser={setUser}/> 
      : <Navigate to="/" replace/> }/>

      <Route path='/interview' element={
      user ? <InterviewStart user={user} setUser={setUser}/> 
      : <Navigate to="/" replace/> }/>

      <Route path='/interview/:id' element={
      user ? <InterviewPage user={user} setUser={setUser}/> 
      : <Navigate to="/" replace/> }/>

      <Route path='/interview/:id/report' element={
      user ? <InterviewReport user={user} setUser={setUser}/> 
      : <Navigate to="/" replace/> }/>

      <Route path='/roadmap' element={
      user ? <Roadmap user={user} setUser={setUser}/> 
      : <Navigate to="/" replace/> }/>

      <Route path='/billing' element={
      user ? <Billing user={user} setUser={setUser}/> 
      : <Navigate to="/" replace/> }/>

      <Route path='/applications' element={
      user ? <Applications />
      : <Navigate to="/" replace/> }/>

      <Route path='/question-banks' element={
      user ? <QuestionBanks user={user} setUser={setUser} />
      : <Navigate to="/" replace/> }/>

      <Route path='/cover-letter' element={
      user ? <CoverLetter user={user} setUser={setUser} />
      : <Navigate to="/" replace/> }/>


   </Routes>
   </>
  )
}

export default App
