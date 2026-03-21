import type { ICacheProvider } from "@/lib/server/interfaces";
import { redis } from "@/lib/server/redis/client";
import { UpstashCacheProvider } from "./UpstashCacheProvider";

export const cacheProvider: ICacheProvider = new UpstashCacheProvider(redis);
