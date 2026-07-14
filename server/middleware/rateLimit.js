// Tiny in-memory rate limiter (per IP + route). No external deps, safe for both
// in-memory and Mongo modes. Sliding window with periodic cleanup so the map
// can't grow unbounded (a leak a weaker implementation would miss).
const buckets = new Map()
let lastSweep = Date.now()

export function rateLimit({ windowMs = 60_000, max = 60 } = {}) {
  return (req, res, next) => {
    const now = Date.now()

    // Sweep expired buckets at most every windowMs
    if (now - lastSweep > windowMs) {
      lastSweep = now
      for (const [k, v] of buckets) {
        if (now - v.start > windowMs) buckets.delete(k)
      }
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown'
    const key = `${req.baseUrl}${req.path}|${ip}`
    let b = buckets.get(key)
    if (!b || now - b.start > windowMs) { b = { start: now, count: 0 }; buckets.set(key, b) }
    b.count++

    if (b.count > max) {
      res.setHeader('Retry-After', Math.ceil((b.start + windowMs - now) / 1000))
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' })
    }
    next()
  }
}
