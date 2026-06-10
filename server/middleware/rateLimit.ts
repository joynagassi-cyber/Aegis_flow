import type { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests = 60, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();
    let entry = requestCounts.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      requestCounts.set(key, entry);
    }

    entry.count++;

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      res.status(429).json({ error: 'Trop de requêtes. Réessaie dans quelques secondes.' });
      return;
    }

    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) requestCounts.delete(key);
  }
}, 60_000);
