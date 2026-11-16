const NEWS_CATEGORIES = {
  ai: '"artificial intelligence" OR "generative AI" OR "AI tools"',
  jobs: '(jobs OR hiring OR careers OR employment) AND (technology OR AI OR workforce)',
  skills: '(upskilling OR reskilling OR "future of work") AND (jobs OR careers OR technology)',
}

const CACHE_TTL_MS = 15 * 60 * 1000
const newsCache = new Map()

const cleanText = (value, fallback = "") => typeof value === "string" ? value.trim() : fallback

export const getCareerNews = async (req, res) => {
  const category = NEWS_CATEGORIES[req.query.category] ? req.query.category : "ai"
  const cacheKey = category
  const cached = newsCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.payload)

  const apiKey = process.env.NEWS_API_KEY?.trim()
  if (!apiKey) return res.status(503).json({ message: "Career news is not configured yet." })

  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const params = new URLSearchParams({
    q: NEWS_CATEGORIES[category],
    from,
    language: "en",
    sortBy: "publishedAt",
    pageSize: "12",
  })

  try {
    const response = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      headers: { "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      console.warn("News provider returned an error:", response.status)
      return res.status(502).json({ message: "Career news is temporarily unavailable." })
    }

    const data = await response.json()
    if (data.status !== "ok" || !Array.isArray(data.articles)) {
      return res.status(502).json({ message: "Career news is temporarily unavailable." })
    }

    const articles = data.articles
      .filter((article) => typeof article.url === "string" && /^https?:\/\//i.test(article.url))
      .map((article) => ({
        title: cleanText(article.title, "Untitled article"),
        description: cleanText(article.description),
        source: cleanText(article.source?.name, "News source"),
        author: cleanText(article.author),
        publishedAt: article.publishedAt,
        url: article.url,
        imageUrl: typeof article.urlToImage === "string" && /^https?:\/\//i.test(article.urlToImage) ? article.urlToImage : "",
      }))

    const payload = { category, articles, updatedAt: new Date().toISOString() }
    newsCache.set(cacheKey, { payload, expiresAt: Date.now() + CACHE_TTL_MS })
    return res.json(payload)
  } catch (error) {
    console.warn("Career news request failed:", error?.name || "unknown")
    return res.status(502).json({ message: "Career news is temporarily unavailable." })
  }
}
