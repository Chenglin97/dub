import { Redis } from "@upstash/redis";

const isValidRedisUrl = (url?: string) =>
  url && url.startsWith("https://");

// No-op Redis proxy for local development without Upstash
const noopRedis = new Proxy({} as Redis, {
  get(_, prop) {
    if (typeof prop === "string") {
      return (..._args: unknown[]) => {
        return Promise.resolve(null);
      };
    }
    return undefined;
  },
});

// Initiate Redis instance by connecting to REST URL
export const redis = isValidRedisUrl(process.env.UPSTASH_REDIS_REST_URL)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })
  : noopRedis;

// This is a separate global Redis instance that we use
// for global operations (e.g. linkCache, recordClick)
// so that if this redis goes down, it won't impact other endpoints
const hasGlobalRedisConfig =
  !!process.env.UPSTASH_GLOBAL_REDIS_REST_URL &&
  !!process.env.UPSTASH_GLOBAL_REDIS_REST_TOKEN;

const redisConfig = {
  url: hasGlobalRedisConfig
    ? process.env.UPSTASH_GLOBAL_REDIS_REST_URL!
    : process.env.UPSTASH_REDIS_REST_URL || "",
  token: hasGlobalRedisConfig
    ? process.env.UPSTASH_GLOBAL_REDIS_REST_TOKEN!
    : process.env.UPSTASH_REDIS_REST_TOKEN || "",
};

export const redisGlobal = isValidRedisUrl(redisConfig.url)
  ? new Redis(redisConfig)
  : noopRedis;

export const redisGlobalWithTimeout = isValidRedisUrl(redisConfig.url)
  ? new Redis({
      ...redisConfig,
      signal: () => AbortSignal.timeout(1000),
    })
  : noopRedis;
