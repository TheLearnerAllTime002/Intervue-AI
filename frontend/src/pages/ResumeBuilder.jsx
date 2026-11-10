import React, { useState } from 'react'
import ResumeForm from '../components/resume/ResumeForm'
import initialData from '../components/resume/initialData'
import { motion } from "motion/react"
import { FiArrowLeft, FiArrowRight, FiCheck, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import PreviewResume from '../components/resume/PreviewResume';

const STEPS = [
  { step: 1, title: "Personal Information", subtitle: "Contact details & font" },
  { step: 2, title: "Professional Summary", subtitle: "A quick intro about yourself" },
  { step: 3, title: "Skills", subtitle: "Your technical skills" },
  { step: 4, title: "Work Experience", subtitle: "Your past jobs & internships" },
  { step: 5, title: "Projects", subtitle: "Projects you have built" },
  { step: 6, title: "Education", subtitle: "Your academic background" },
  { step: 7, title: "Custom Sections", subtitle: "Achievements, languages, hobbies…" },
];

const TOTAL_STEPS = STEPS.length;

function ResumeBuilder({ user, setUser }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState(initialData)
  const [showPreview, setShowPreview] = useState(false)
  const navigate = useNavigate()
  const progressPct = (currentStep / TOTAL_STEPS) * 100
  const activeStep = STEPS.find((s) => s.step === currentStep)
  const isLastStep = currentStep === TOTAL_STEPS

  const goPrev = () => currentStep > 1 && setCurrentStep(currentStep - 1)
  const goNext = () => currentStep < TOTAL_STEPS && setCurrentStep(currentStep + 1)

  if (showPreview) {
    return <PreviewResume data={data} user={user} setUser={setUser} onBack={() => setShowPreview(false)} />
  }

  return (
    <div className='min-h-screen bg-[var(--neo-paper)] text-[var(--neo-ink)] flex flex-col'>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className='sticky top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]'
      >
        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6'>
          <button onClick={() => navigate("/dashboard")} className='resume-home-button flex items-center gap-2 p-0'>
            <span className='text-base font-extrabold tracking-tight'>Intervue AI</span>
            <span className='hidden border-2 border-black bg-sky-200 px-2 py-0.5 text-[10px] font-bold sm:block'>RESUME BUILDER</span>
          </button>
          <button onClick={() => setShowPreview(true)} className='neo-blue-surface flex items-center gap-2 px-3 py-2 text-xs'>
            <FiEye size={15} /> Preview
          </button>
        </div>
      </motion.nav>

      <main className='mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10'>
        <header className='mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-sky-900'>Resume workspace</p>
            <h1 className='text-3xl font-black sm:text-4xl'>Build your next opportunity.</h1>
            <p className='mt-2 max-w-xl text-sm font-medium text-black/65'>Add your experience one section at a time. Your details stay together as you move through the builder.</p>
          </div>
          <div className='w-full border-2 border-black bg-sky-100 p-3 shadow-[4px_4px_0_#171717] sm:w-56'>
            <div className='mb-2 flex items-center justify-between text-xs font-extrabold'>
              <span>BUILD PROGRESS</span><span>{Math.round(progressPct)}%</span>
            </div>
            <div className='h-3 border-2 border-black bg-white'>
              <div className='h-full bg-sky-400 transition-all duration-300' style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </header>

        <div className='grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'>
          <aside className='neo-blue-surface rounded-lg p-4 sm:p-5'>
            <div className='mb-4'>
              <h2 className='text-sm font-black uppercase tracking-wide'>Resume sections</h2>
              <p className='mt-1 text-xs font-medium text-black/65'>Select a section to edit.</p>
            </div>
            <nav aria-label='Resume sections' className='flex flex-col gap-2'>
              {STEPS.map((item) => {
                const isActive = currentStep === item.step
                const isComplete = currentStep > item.step
                return (
                  <button
                    key={item.step}
                    type='button'
                    aria-current={isActive ? 'step' : undefined}
                    onClick={() => setCurrentStep(item.step)}
                    className='resume-step-button flex items-center gap-3 rounded-md px-2.5 py-2.5'
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black text-xs font-black ${isActive ? 'bg-sky-300' : isComplete ? 'bg-white' : 'bg-white/60'}`}>
                      {isComplete ? <FiCheck size={15} /> : `0${item.step}`}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-xs font-extrabold'>{item.title}</span>
                      <span className='mt-0.5 block truncate text-[10px] font-medium text-black/65'>{item.subtitle}</span>
                    </span>
                  </button>
                )
              })}
            </nav>
          </aside>

          <section className='rounded-lg border-2 border-black bg-white p-4 shadow-[5px_5px_0_#171717] sm:p-7'>
            <div className='mb-6 border-b-2 border-black/15 pb-5'>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <p className='text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-900'>Section {currentStep} of {TOTAL_STEPS}</p>
                <p className='text-[10px] font-bold text-black/55'>{Math.round(progressPct)}% complete</p>
              </div>
              <h2 className='text-2xl font-black sm:text-3xl'>{activeStep.title}</h2>
              <p className='mt-1 text-sm font-medium text-black/65'>{activeStep.subtitle}</p>
            </div>

            <ResumeForm step={currentStep} data={data} setData={setData} />

            <div className='mt-8 flex items-center justify-between gap-3 border-t-2 border-black/15 pt-5'>
              <button onClick={goPrev} disabled={currentStep === 1} className='flex items-center gap-2 px-3 py-2 text-xs'>
                <FiArrowLeft size={15} /> Previous
              </button>
              <span className='hidden text-xs font-bold text-black/55 sm:block'>Section {currentStep} / {TOTAL_STEPS}</span>
              {isLastStep ? (
                <button onClick={() => setShowPreview(true)} className='neo-blue-surface flex items-center gap-2 px-3 py-2 text-xs'>
                  <FiEye size={15} /> Preview resume
                </button>
              ) : (
                <button onClick={goNext} className='neo-blue-surface flex items-center gap-2 px-3 py-2 text-xs'>
                  Next <FiArrowRight size={15} />
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ResumeBuilder
