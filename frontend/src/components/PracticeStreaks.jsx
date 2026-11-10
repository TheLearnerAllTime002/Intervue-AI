import React from "react"
import { FiAward, FiCalendar, FiTarget } from "react-icons/fi"

const dayKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function getPracticeDays(interviews) {
  return [...new Set(interviews.flatMap((interview) =>
    (interview.questions || [])
      .filter((question) => question.userAnswer?.trim())
      .map((question) => dayKey(question.answeredAt || interview.updatedAt || interview.createdAt))
      .filter(Boolean)
  ))].map((key) => {
    const [year, month, day] = key.split("-").map(Number)
    return new Date(year, month, day).setHours(0, 0, 0, 0)
  }).sort((a, b) => b - a)
}

function PracticeStreaks({ interviews = [] }) {
  const days = getPracticeDays(interviews)
  const today = new Date().setHours(0, 0, 0, 0)
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.setHours(0, 0, 0, 0)
  let currentStreak = 0
  let expected = days[0] === today ? today : days[0] === yesterday ? yesterday : null
  for (const day of days) {
    if (expected === null || day !== expected) break
    currentStreak += 1
    const priorDate = new Date(expected)
    priorDate.setDate(priorDate.getDate() - 1)
    expected = priorDate.setHours(0, 0, 0, 0)
  }

  let longestStreak = 0
  let run = 0
  let priorDay = null
  for (const day of [...days].sort((a, b) => a - b)) {
    const followingDate = priorDay === null ? null : new Date(priorDay)
    if (followingDate) followingDate.setDate(followingDate.getDate() + 1)
    run = followingDate?.getTime() === day ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
    priorDay = day
  }

  const completed = interviews.filter((item) => item.status === "completed").length
  const badges = [
    { name: "First interview", detail: "Complete your first mock interview", earned: completed >= 1, icon: FiAward },
    { name: "Three practice days", detail: "Practice on three different days", earned: days.length >= 3, icon: FiCalendar },
    { name: "Week in motion", detail: "Reach a 7-day practice streak", earned: longestStreak >= 7, icon: FiTarget },
    { name: "Ten interviews", detail: "Complete 10 mock interviews", earned: completed >= 10, icon: FiAward },
  ]

  return (
    <section className="mt-4 rounded-lg border-2 border-black bg-sky-100 p-4 shadow-[4px_4px_0_#171717]" aria-label="Practice streak and achievements">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-950">Practice consistency</p>
          <div className="mt-1 flex items-baseline gap-4">
            <p className="text-lg font-black">{currentStreak} day streak</p>
            <p className="text-xs font-bold text-black/65">Longest: {longestStreak} days</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map(({ name, detail, earned, icon: Icon }) => (
            <span key={name} title={detail} className={`inline-flex items-center gap-1.5 border-2 border-black px-2 py-1 text-[10px] font-extrabold ${earned ? "bg-yellow-200" : "bg-white/70 text-black/45"}`}>
              <Icon size={12} />{name}{earned ? " · Earned" : " · Locked"}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] font-medium text-black/60">A practice day counts when you submit at least one answer.</p>
    </section>
  )
}

export default PracticeStreaks
