import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

const isRedisAvailable = process.env.UPSTASH_REDIS_REST_URL?.startsWith("https://");

// No-op ratelimiter for local development
const noopRatelimit = {
  limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
};

// Create a new ratelimiter, that allows 10 requests per 10 seconds by default
export const ratelimit = (
  requests: number = 10,
  seconds:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = "10 s",
) => {
  if (!isRedisAvailable) return noopRatelimit as unknown as Ratelimit;

  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(requests, seconds),
    analytics: true,
    prefix: "dub",
    timeout: 1000,
  });
};
