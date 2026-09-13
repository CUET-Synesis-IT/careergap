import crypto from "node:crypto";

import { redis } from "../config/redis";

import { getCachedCareerProfile } from "../cache/career-cache";

import type { CareerProfile } from "../types/career";

const CAREER_LOCK_PREFIX = "career:lock:";
const CAREER_LOCK_TTL_SECONDS = 60;

export interface CareerLock {
  key: string;
  token: string;
}

export function getCareerLockKey(slug: string): string {
  return `${CAREER_LOCK_PREFIX}${slug}`;
}

export async function acquireCareerLock(
  slug: string,
): Promise<CareerLock | null> {
  const key = getCareerLockKey(slug);
  const token = crypto.randomUUID();

  const result = await redis.set(key, token, {
    NX: true,
    EX: CAREER_LOCK_TTL_SECONDS,
  });

  if (result !== "OK") {
    return null;
  }

  return {
    key,
    token,
  };
}

const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

export async function releaseCareerLock(lock: CareerLock): Promise<boolean> {
  const result = await redis.eval(RELEASE_LOCK_SCRIPT, {
    keys: [lock.key],
    arguments: [lock.token],
  });

  return result === 1;
}

const CAREER_LOCK_POLL_INTERVAL_MS = 500;
const CAREER_LOCK_MAX_WAIT_MS = 10_000;

export async function waitForCareerProfile(
  slug: string,
): Promise<CareerProfile | null> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < CAREER_LOCK_MAX_WAIT_MS) {
    const cached = await getCachedCareerProfile(slug);

    if (cached) {
      return cached;
    }

    await sleep(CAREER_LOCK_POLL_INTERVAL_MS);
  }

  return null;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
