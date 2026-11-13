import React, { useState } from 'react'
import { FiArrowUpRight, FiClock, FiFileText, FiTrash2 } from 'react-icons/fi'
import { ListSkeleton } from './Skeleton'

const formatDate = (value) => {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function InterviewHistory({ interviews = [], loading = false, onOpenInterview, onStartInterview, onDeleteInterview }) {
  const [showAll, setShowAll] = useState(false)
  const [deletingId, setDeletingId] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const ordered = [...interviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const visible = showAll ? ordered : ordered.slice(0, 5)

  return (
    <section className='mt-8' aria-labelledby='attempt-history-heading'>
      <div className='mb-3 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='inline-block border-2 border-black bg-yellow-200 px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest'>Saved attempts</p>
          <h3 id='attempt-history-heading' className='mt-2 text-lg font-black'>Interview history</h3>
        </div>
        <button onClick={onStartInterview} className='neo-blue-surface px-3 py-2 text-xs'>Start a practice interview</button>
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : ordered.length === 0 ? (
        <div className='neo-yellow-surface rounded-lg border-2 border-black p-5 sm:p-6'>
          <p className='text-sm font-extrabold'>No attempts saved yet.</p>
          <p className='mt-1 text-xs font-medium text-black/70'>Your completed and in-progress interviews will be listed here.</p>
        </div>
      ) : (
        <div className='flex flex-col gap-2.5'>
          {visible.map((interview) => {
            const isCompleted = interview.status === 'completed'
            const answeredCount = interview.questions?.filter((question) => question.userAnswer?.trim()).length ?? 0
            return (
              <div key={interview._id} className='history-attempt-row flex w-full items-stretch gap-2 p-2 sm:gap-3 sm:p-3'>
                <button
                  type='button'
                  onClick={() => onOpenInterview(interview)}
                  className='history-attempt-open flex min-w-0 flex-1 items-center gap-3 bg-transparent p-1 text-left shadow-none sm:gap-4 sm:p-1.5'
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black ${isCompleted ? 'bg-sky-200' : 'bg-yellow-200'}`}>
                    {isCompleted ? <FiFileText size={17} /> : <FiClock size={17} />}
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='flex flex-wrap items-center gap-2'>
                      <span className='truncate text-sm font-extrabold'>{interview.role || 'Interview practice'}</span>
                      <span className='border border-black px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide'>{interview.type || 'practice'}</span>
                      <span className={`border border-black px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${isCompleted ? 'bg-sky-100' : 'bg-yellow-100'}`}>
                        {isCompleted ? 'Completed' : 'In progress'}
                      </span>
                    </span>
                    <span className='mt-1 block text-[10px] font-medium text-black/65'>
                      {formatDate(interview.createdAt)} - {answeredCount}/{interview.questions?.length ?? 0} answers submitted
                    </span>
                  </span>
                  <span className='flex shrink-0 items-center gap-2'>
                    {isCompleted ? (
                      <span className='text-right'>
                        <span className='block text-lg font-black'>{Math.round(interview.overallScore || 0)}</span>
                        <span className='block text-[9px] font-bold uppercase tracking-wide text-black/60'>Score</span>
                      </span>
                    ) : (
                      <span className='hidden text-[10px] font-bold text-black/65 sm:inline'>Resume</span>
                    )}
                    <FiArrowUpRight size={16} />
                  </span>
                </button>
                <button
                  type='button'
                  aria-label={`Delete ${interview.role || 'interview'} attempt`}
                  title='Delete interview attempt'
                  disabled={deletingId === interview._id}
                  onClick={async () => {
                    if (!window.confirm(`Delete this ${interview.role || 'interview'} attempt? This cannot be undone.`)) return
                    setDeletingId(interview._id)
                    setDeleteError("")
                    try {
                      await onDeleteInterview(interview)
                    } catch (error) {
                      setDeleteError(error.response?.data?.message || error.message || "Could not delete this interview.")
                    } finally {
                      setDeletingId("")
                    }
                  }}
                  className='history-attempt-delete flex h-10 w-10 shrink-0 items-center justify-center self-center bg-red-100 text-red-950'
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            )
          })}
          {ordered.length > 5 && (
            <button type='button' onClick={() => setShowAll((current) => !current)} className='history-show-all self-start px-3 py-2 text-xs'>
              {showAll ? 'Show recent only' : `Show all ${ordered.length} attempts`}
            </button>
          )}
        </div>
      )}
      {deleteError && <p role='alert' className='mt-3 border-2 border-black bg-red-100 p-3 text-xs font-bold text-red-950'>{deleteError}</p>}
    </section>
  )
}

export default InterviewHistory
