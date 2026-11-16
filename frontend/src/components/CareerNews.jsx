import { useCallback, useEffect, useState } from "react"
import { FiArrowUpRight, FiClock, FiRefreshCw, FiZap, FiChevronDown, FiChevronUp } from "react-icons/fi"
import api from "../utils/axios"

const CATEGORIES = [
  { id: "ai", label: "AI" },
  { id: "jobs", label: "Jobs" },
  { id: "skills", label: "Skills" },
]

const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)
}

export default function CareerNews() {
  const [category, setCategory] = useState("ai")
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAll, setShowAll] = useState(false)

  const loadNews = useCallback(async (selectedCategory, signal) => {
    setLoading(true)
    setError("")
    try {
      const response = await api.get("/api/news/career", { params: { category: selectedCategory }, signal })
      setArticles(response.data?.articles ?? [])
    } catch (requestError) {
      if (requestError.code === "ERR_CANCELED") return
      setArticles([])
      setError(requestError.response?.data?.message || "News could not be loaded. Try again in a moment.")
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadNews(category, controller.signal)
    return () => controller.abort()
  }, [category, loadNews])

  const visibleArticles = showAll ? articles : articles.slice(0, 3)

  return <section data-tour="career-news" aria-labelledby="career-news-heading" className="mt-6 rounded-2xl border-2 border-black bg-gradient-to-br from-sky-100 via-white to-yellow-100 p-4 shadow-[4px_4px_0_#171717] sm:p-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-900/20 bg-sky-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-sky-950"><FiZap /> Career briefing</p>
        <h3 id="career-news-heading" className="mt-2 text-lg font-black">AI &amp; job news</h3>
        <p className="mt-1 text-xs text-black/60">A few useful stories, refreshed regularly.</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-lg border-2 border-black bg-white p-1" aria-label="News topics">
          {CATEGORIES.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} aria-pressed={category === item.id} className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${category === item.id ? "bg-black text-white" : "text-black/65 hover:bg-yellow-100"}`}>{item.label}</button>)}
        </div>
        <button type="button" onClick={() => loadNews(category, new AbortController().signal)} disabled={loading} aria-label="Refresh news" className="rounded border-2 border-black bg-white p-2 hover:bg-sky-100 disabled:opacity-50"><FiRefreshCw className={loading ? "animate-spin" : ""} size={14} /></button>
      </div>
    </div>

    {loading ? <div className="mt-4 grid gap-3 md:grid-cols-3" aria-label="Loading news" aria-busy="true">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl border border-sky-900/15 bg-white/80" />)}</div>
      : error ? <div role="alert" className="mt-4 border-2 border-black bg-white p-4 text-sm font-semibold">{error}<button type="button" onClick={() => loadNews(category, new AbortController().signal)} className="ml-2 underline underline-offset-2">Retry</button></div>
        : articles.length === 0 ? <p className="mt-4 border-2 border-black bg-white p-4 text-sm">No recent stories found for this topic. Try another category.</p>
          : <><div className="mt-4 grid gap-3 md:grid-cols-3">{visibleArticles.map((article, index) => <article key={`${article.url}-${article.publishedAt}`} className={`flex min-h-32 flex-col rounded-xl border border-black/10 p-3 shadow-sm ${index % 2 === 0 ? "bg-white" : "bg-yellow-50"}`}>
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-black/55"><span className="truncate">{article.source}</span><span className="inline-flex shrink-0 items-center gap-1"><FiClock size={11} />{formatDate(article.publishedAt)}</span></div>
            <h4 className="mt-2 line-clamp-2 text-sm font-extrabold leading-5">{article.title}</h4>
            {article.description && <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-black/65">{article.description}</p>}
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex w-fit items-center gap-1 pt-3 text-xs font-extrabold underline decoration-2 underline-offset-2">Read source <FiArrowUpRight size={13} /></a>
          </article>)}</div>{articles.length > 3 && <button type="button" onClick={() => setShowAll((current) => !current)} className="mt-3 inline-flex items-center gap-1 rounded-full border border-sky-900/25 bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-950 hover:bg-sky-200">{showAll ? <>Show less <FiChevronUp /></> : <>Show more stories <FiChevronDown /></>}</button>}</>}
  </section>
}
