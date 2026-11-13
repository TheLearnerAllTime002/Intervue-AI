import React from 'react'
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Skeleton } from './Skeleton'

const dateLabel = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

function ProgressTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const attempt = payload[0].payload
  return (
    <div className='border-2 border-black bg-white p-3 text-xs shadow-[3px_3px_0_#171717]'>
      <p className='font-extrabold text-black'>{label}</p>
      <p className='text-[10px] font-medium text-black/65'>{attempt.date}</p>
      <p className='mt-1 font-bold text-sky-950'>{attempt.role} / {attempt.type}</p>
      <p className='mt-1 text-black'>Score: <strong>{attempt.score}/100</strong></p>
    </div>
  )
}

function InterviewProgress({ interviews = [], loading = false }) {
  const attempts = interviews
    .filter((interview) => interview.status === 'completed' && Number.isFinite(Number(interview.overallScore)))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((interview, index) => ({
      ...interview,
      score: Number(interview.overallScore),
      date: dateLabel(interview.createdAt),
      label: `Attempt ${index + 1}`,
    }))

  const scoreChange = attempts.length > 1
    ? attempts[attempts.length - 1].score - attempts[0].score
    : null

  return (
    <section className='mt-7' aria-labelledby='progress-heading'>
      <div className='mb-3 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='inline-block border-2 border-black bg-sky-200 px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest'>Progress</p>
          <h3 id='progress-heading' className='mt-2 text-lg font-black'>Interview scores over time</h3>
        </div>
        {scoreChange !== null && (
          <div className={`flex items-center gap-1.5 border-2 border-black px-3 py-2 text-xs font-extrabold shadow-[3px_3px_0_#171717] ${scoreChange >= 0 ? 'bg-sky-100 text-sky-950' : 'bg-yellow-100 text-black'}`}>
            {scoreChange >= 0 ? <FiTrendingUp size={15} /> : <FiTrendingDown size={15} />}
            {scoreChange > 0 ? '+' : ''}{scoreChange} pts since first attempt
          </div>
        )}
      </div>

      <div className='neo-blue-surface rounded-lg p-3 sm:p-5'>
        {loading ? (
          <div aria-busy='true' className='min-h-48 space-y-4 p-2'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-32 w-full' />
            <div className='flex gap-3'><Skeleton className='h-3 w-16' /><Skeleton className='h-3 w-16' /><Skeleton className='h-3 w-16' /></div>
          </div>
        ) : attempts.length < 1 ? (
          <div className='flex min-h-48 flex-col items-center justify-center px-4 text-center'>
            <p className='text-base font-black text-sky-950'>Your score trend will appear here.</p>
            <p className='mt-2 max-w-md text-xs font-semibold text-black/70'>Complete an interview to save your first score. Each completed attempt will be added to this chart.</p>
          </div>
        ) : (
          <div className='h-64 w-full sm:h-72' role='img' aria-label='Line chart showing completed interview scores over time'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={attempts} margin={{ top: 14, right: 12, bottom: 4, left: -18 }}>
                <defs>
                  <linearGradient id='interviewScoreFill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#0284c7' stopOpacity={0.34} />
                    <stop offset='100%' stopColor='#0284c7' stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke='#171717' strokeOpacity={0.16} vertical={false} />
                <XAxis dataKey='label' tick={{ fill: '#171717', fontSize: 11, fontWeight: 700 }} axisLine={{ stroke: '#171717' }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#171717', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ProgressTooltip />} />
                <Area type='monotone' dataKey='score' stroke='#075985' strokeWidth={3} fill='url(#interviewScoreFill)' activeDot={{ r: 6, fill: '#ffe15a', stroke: '#171717', strokeWidth: 2 }} dot={{ r: 4, fill: '#075985', stroke: '#171717', strokeWidth: 1.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  )
}

export default InterviewProgress
