type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function trimBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  while (buckets.size > MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export function rateLimit(
  request: Request,
  { scope, limit, windowMs }: RateLimitOptions,
) {
  const now = Date.now();
  trimBuckets(now);

  const key = scope + ":" + getClientIp(request);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  current.count += 1;

  if (current.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
