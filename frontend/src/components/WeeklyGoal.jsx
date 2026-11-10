import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FiCheck, FiEdit2, FiTarget } from 'react-icons/fi'

const STORAGE_KEY = 'intervue_weekly_goal'
const DEFAULT_GOAL = 3

function getWeekStart() {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

function countThisWeek(interviews) {
  const weekStart = getWeekStart()
  return interviews.filter((iv) => {
    const created = new Date(iv.createdAt).getTime()
    return created >= weekStart && iv.status === 'completed'
  }).length
}

// SVG ring progress
function Ring({ pct, size = 88, stroke = 8, color }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(1, pct))
  return (
    <svg width={size} height={size} className='rotate-[-90deg]'>
      <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke='#e5e7eb' strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill='none'
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap='round'
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

function WeeklyGoal({ interviews = [] }) {
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? Number(saved) : DEFAULT_GOAL
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(goal)

  const thisWeek = useMemo(() => countThisWeek(interviews), [interviews])
  const pct = goal > 0 ? thisWeek / goal : 0
  const done = thisWeek >= goal
  const color = done ? '#16a34a' : pct >= 0.5 ? '#d97706' : '#0369a1'

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(goal)) }, [goal])

  const saveGoal = () => {
    const val = Math.max(1, Math.min(20, Number(draft) || DEFAULT_GOAL))
    setGoal(val)
    setDraft(val)
    setEditing(false)
  }

  // Days left in week
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // Mon=1 … Sun=7
  const daysLeft = 8 - dayOfWeek // days remaining incl. today

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className='mt-4 border-2 border-black bg-sky-50 shadow-[4px_4px_0_#171717]'
      aria-label='Weekly interview goal'
    >
      <div className='flex flex-wrap items-center justify-between gap-3 border-b-2 border-black px-4 py-3'>
        <div>
          <p className='text-[10px] font-black uppercase tracking-widest text-sky-950'>Weekly goal</p>
          <h3 className='mt-0.5 text-base font-black'>Interview target</h3>
        </div>
        <button
          onClick={() => { setDraft(goal); setEditing((v) => !v) }}
          className='flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1.5 text-[10px] font-extrabold hover:bg-sky-100 transition-colors'
        >
          <FiEdit2 size={11} /> {editing ? 'Cancel' : 'Set goal'}
        </button>
      </div>

      <div className='flex flex-wrap items-center gap-6 px-4 py-4'>
        {/* Ring */}
        <div className='relative flex items-center justify-center'>
          <Ring pct={pct} color={color} />
          <div className='absolute flex flex-col items-center'>
            {done
              ? <FiCheck size={22} color={color} strokeWidth={3} />
              : <span className='text-xl font-black leading-none' style={{ color }}>{thisWeek}</span>
            }
            <span className='text-[9px] font-bold text-black/50 mt-0.5'>/ {goal}</span>
          </div>
        </div>

        {/* Info */}
        <div className='flex-1 min-w-[140px]'>
          {done ? (
            <p className='text-sm font-black text-green-700'>🎉 Goal reached this week!</p>
          ) : (
            <p className='text-sm font-black text-black'>
              {goal - thisWeek} more to go
            </p>
          )}
          <p className='mt-1 text-xs font-semibold text-black/60'>
            {thisWeek} completed · {daysLeft} day{daysLeft !== 1 ? 's' : ''} left this week
          </p>

          {/* Mini bar */}
          <div className='mt-2.5 flex gap-1'>
            {Array.from({ length: goal }).map((_, i) => (
              <div
                key={i}
                className='h-2 flex-1 rounded-sm border border-black/20 transition-colors duration-300'
                style={{ backgroundColor: i < thisWeek ? color : '#e5e7eb' }}
              />
            ))}
          </div>
          <p className='mt-1 text-[10px] font-medium text-black/45'>Each bar = 1 completed interview</p>
        </div>
      </div>

      {/* Goal editor */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='overflow-hidden border-t-2 border-black'
          >
            <div className='flex flex-wrap items-center gap-3 bg-white px-4 py-3'>
              <FiTarget size={14} className='text-sky-900' />
              <span className='text-xs font-extrabold'>Interviews per week:</span>
              <div className='flex items-center gap-1'>
                {[1, 2, 3, 4, 5, 7, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDraft(n)}
                    className={`h-8 w-8 border-2 border-black text-xs font-extrabold transition-colors ${draft === n ? 'bg-sky-300' : 'bg-white hover:bg-sky-50'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={saveGoal}
                className='border-2 border-black bg-sky-300 px-3 py-1.5 text-xs font-extrabold hover:bg-sky-400 transition-colors'
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

export default WeeklyGoal
