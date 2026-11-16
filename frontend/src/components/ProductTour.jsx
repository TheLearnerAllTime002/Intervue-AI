import { useEffect, useState } from "react"
import { FiArrowLeft, FiArrowRight, FiX } from "react-icons/fi"

const TOUR_STEPS = [
  { selector: "[data-tour='create-interview']", title: "Start a mock interview", description: "Create a practice interview tailored to the role you want. Your interview history and results will be ready here afterward." },
  { selector: "[data-tour='career-tools']", title: "Explore your career tools", description: "Build and score your resume, create a learning roadmap, draft cover letters, and practice from question banks." },
  { selector: "[data-tour='dashboard-stats']", title: "Track your progress", description: "See your interview activity, questions answered, completion count, and average score at a glance." },
  { selector: "[data-tour='dashboard-insights']", title: "Build a practice habit", description: "Review your practice streak, weekly goal, and skill breakdown to see where to focus next." },
  { selector: "[data-tour='career-news']", title: "Stay current with AI and job news", description: "Browse recent AI, hiring, and career skills stories, then follow the source link to read more." },
  { selector: "[data-tour='dashboard-history']", title: "Review past interviews", description: "Open completed reports, continue unfinished interviews, or remove an old session from your history." },
  { selector: "[data-tour='workspace-tools']", title: "Keep your search organized", description: "Manage job applications and find help from the workspace links in the sidebar." },
]

const STORAGE_KEY = "intervue-product-tour-complete"

export default function ProductTour() {
  const [stepIndex, setStepIndex] = useState(null)
  const [targetRect, setTargetRect] = useState(null)

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setStepIndex(null)
    setTargetRect(null)
  }

  const open = () => setStepIndex(0)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== "true") {
      const timer = window.setTimeout(open, 700)
      return () => window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const handleStart = () => open()
    window.addEventListener("intervue:start-product-tour", handleStart)
    return () => window.removeEventListener("intervue:start-product-tour", handleStart)
  }, [])

  useEffect(() => {
    if (stepIndex === null) return undefined
    const updateTarget = () => {
      const target = document.querySelector(TOUR_STEPS[stepIndex].selector)
      if (!target) { setTargetRect(null); return }
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
      const rect = target.getBoundingClientRect()
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    }
    updateTarget()
    window.addEventListener("resize", updateTarget)
    window.addEventListener("scroll", updateTarget, true)
    return () => {
      window.removeEventListener("resize", updateTarget)
      window.removeEventListener("scroll", updateTarget, true)
    }
  }, [stepIndex])

  const step = stepIndex === null ? null : TOUR_STEPS[stepIndex]

  return <>
    <button type="button" onClick={open} className="fixed bottom-4 right-4 z-[60] rounded-full border-2 border-black bg-yellow-300 px-4 py-2 text-xs font-extrabold text-black shadow-[3px_3px_0_#171717] hover:-translate-y-0.5" aria-label="Take the product tour">Product tour</button>
    {step && <div className="fixed inset-0 z-[70]" aria-live="polite">
      <div className="absolute inset-0 bg-black/60" onClick={finish} />
      {targetRect && <div className="pointer-events-none absolute rounded-xl ring-4 ring-yellow-300 ring-offset-4 ring-offset-transparent transition-all" style={{ top: targetRect.top - 5, left: targetRect.left - 5, width: targetRect.width + 10, height: targetRect.height + 10 }} />}
      <section role="dialog" aria-modal="true" aria-labelledby="tour-title" className="absolute left-1/2 top-1/2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 border-2 border-black bg-white p-5 shadow-[7px_7px_0_#171717] sm:p-6">
        <div className="mb-4 flex items-center justify-between"><span className="border-2 border-black bg-sky-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest">Product tour · {stepIndex + 1} of {TOUR_STEPS.length}</span><button type="button" onClick={finish} aria-label="End product tour" className="p-1 text-black/60 hover:text-black"><FiX size={19} /></button></div>
        <h2 id="tour-title" className="text-xl font-black">{step.title}</h2><p className="mt-2 text-sm leading-6 text-black/70">{step.description}</p>
        <div className="mt-6 flex items-center justify-between gap-3"><button type="button" onClick={finish} className="text-xs font-bold text-black/60 underline underline-offset-4">End tour</button><div className="flex gap-2">{stepIndex > 0 && <button type="button" onClick={() => setStepIndex((index) => index - 1)} className="inline-flex items-center gap-1 border-2 border-black px-3 py-2 text-xs font-bold"><FiArrowLeft /> Back</button>}<button type="button" onClick={() => stepIndex === TOUR_STEPS.length - 1 ? finish() : setStepIndex((index) => index + 1)} className="inline-flex items-center gap-1 border-2 border-black bg-yellow-300 px-3 py-2 text-xs font-extrabold shadow-[2px_2px_0_#171717]">{stepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}{stepIndex < TOUR_STEPS.length - 1 && <FiArrowRight />}</button></div></div>
      </section>
    </div>}
  </>
}
