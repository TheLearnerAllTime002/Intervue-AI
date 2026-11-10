import React, { useMemo } from 'react'
import { motion } from 'motion/react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'

// Maps role keywords → skill category labels shown on the radar
const SKILL_CATEGORIES = [
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'communication', label: 'Communication' },
  { key: 'technicalDepth', label: 'Technical Depth' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'relevance', label: 'Relevance' },
]

function avg(values) {
  const valid = values.filter((v) => typeof v === 'number' && !Number.isNaN(v))
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0
}

// Derive per-category scores from all completed interviews
function buildRadarData(interviews) {
  const buckets = {
    problemSolving: [],
    communication: [],
    technicalDepth: [],
    clarity: [],
    confidence: [],
    relevance: [],
  }

  for (const interview of interviews) {
    if (interview.status !== 'completed') continue
    for (const q of interview.questions || []) {
      const fb = q.feedback
      if (!fb) continue
      // score / correctness → problem solving & technical depth
      buckets.problemSolving.push(Number(fb.score ?? 0))
      buckets.technicalDepth.push(Number(fb.correctness ?? 0))
      buckets.communication.push(Number(fb.communication ?? 0))
      buckets.clarity.push(Number(fb.clarity ?? 0))
      buckets.confidence.push(Number(fb.confidence ?? 0))
      buckets.relevance.push(Number(fb.relevance ?? 0))
    }
  }

  return SKILL_CATEGORIES.map(({ key, label }) => ({
    skill: label,
    score: avg(buckets[key]),
  }))
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className='border-2 border-black bg-white px-3 py-2 text-xs shadow-[3px_3px_0_#171717]'>
      <p className='font-extrabold text-black'>{payload[0]?.payload?.skill}</p>
      <p className='mt-0.5 font-bold text-sky-950'>{payload[0]?.value} / 100</p>
    </div>
  )
}

function SkillRadarChart({ interviews = [] }) {
  const data = useMemo(() => buildRadarData(interviews), [interviews])
  const completed = interviews.filter((i) => i.status === 'completed')
  const hasData = completed.length > 0 && data.some((d) => d.score > 0)

  // Best and weakest skill
  const sorted = [...data].sort((a, b) => b.score - a.score)
  const best = sorted[0]
  const weakest = sorted[sorted.length - 1]

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className='mt-4 border-2 border-black bg-white shadow-[4px_4px_0_#171717]'
      aria-label='Skill radar chart'
    >
      <div className='flex flex-wrap items-center justify-between gap-3 border-b-2 border-black px-4 py-3'>
        <div>
          <p className='text-[10px] font-black uppercase tracking-widest text-sky-950'>Skill breakdown</p>
          <h3 className='mt-0.5 text-base font-black'>Performance Radar</h3>
        </div>
        {hasData && (
          <div className='flex flex-wrap gap-2'>
            <span className='border-2 border-black bg-sky-100 px-2 py-1 text-[10px] font-extrabold'>
              ↑ Best · {best.skill} ({best.score})
            </span>
            <span className='border-2 border-black bg-yellow-100 px-2 py-1 text-[10px] font-extrabold'>
              ↓ Focus · {weakest.skill} ({weakest.score})
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className='flex min-h-48 flex-col items-center justify-center px-4 py-8 text-center'>
          <p className='text-sm font-black text-black/70'>Complete an interview to see your skill radar.</p>
          <p className='mt-1 text-xs font-medium text-black/45'>Scores across 6 dimensions will appear here after your first completed session.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-0 sm:grid-cols-[1fr_auto]'>
          {/* Chart */}
          <div className='px-2 py-4'>
            <ResponsiveContainer width='100%' height={280}>
              <RadarChart data={data} cx='50%' cy='50%' outerRadius='65%' margin={{ top: 16, right: 28, bottom: 16, left: 28 }}>
                <PolarGrid stroke='#171717' strokeOpacity={0.18} strokeWidth={1.2} />
                <PolarAngleAxis
                  dataKey='skill'
                  tick={{ fill: '#171717', fontSize: 10, fontWeight: 700 }}
                />
                <Radar
                  name='Skills'
                  dataKey='score'
                  stroke='#0369a1'
                  fill='#0369a1'
                  fillOpacity={0.18}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0369a1', stroke: '#171717', strokeWidth: 1.5 }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score table */}
          <div className='flex flex-col justify-center gap-0 border-t-2 border-black sm:border-l-2 sm:border-t-0 min-w-[160px]'>
            {data.map(({ skill, score }, i) => {
              const pct = Math.min(100, score)
              const color = pct >= 70 ? '#16a34a' : pct >= 45 ? '#d97706' : '#dc2626'
              return (
                <div key={skill} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i < data.length - 1 ? 'border-b border-black/10' : ''}`}>
                  <span className='text-[11px] font-bold text-black/80'>{skill}</span>
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 w-16 overflow-hidden rounded-full bg-black/10'>
                      <div className='h-full rounded-full transition-all duration-500' style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className='w-7 text-right text-[11px] font-extrabold' style={{ color }}>{score}</span>
                  </div>
                </div>
              )
            })}
            <div className='border-t-2 border-black px-4 py-2.5'>
              <p className='text-[10px] font-bold text-black/50'>Based on {completed.length} completed interview{completed.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default SkillRadarChart
