import crypto from "node:crypto";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  connectRedis,
  disconnectRedis,
  redis,
} from "../src/config/redis";

import {
  acquireCareerLock,
  getCareerLockKey,
  releaseCareerLock,
} from "../src/locks/career-lock";

describe("Career Lock", () => {
  const slug = `lock-test-${crypto.randomUUID()}`;

  beforeAll(async () => {
    if (!redis.isOpen) {
      await connectRedis();
    }

    await redis.del(
      getCareerLockKey(slug),
    );
  });

  afterAll(async () => {
    if (redis.isOpen) {
      await redis.del(
        getCareerLockKey(slug),
      );

      await disconnectRedis();
    }
  });

  it("uses the expected Redis lock key", () => {
    expect(
      getCareerLockKey("backend_engineer"),
    ).toBe(
      "career:lock:backend_engineer",
    );
  });

  it("allows one request to acquire a lock", async () => {
    const lock = await acquireCareerLock(slug);

    expect(lock).not.toBeNull();
    expect(lock!.key).toBe(
      getCareerLockKey(slug),
    );

    expect(lock!.token).toEqual(
      expect.any(String),
    );

    await releaseCareerLock(lock!);
  });

  it("does not allow a second request to acquire the same lock", async () => {
    const firstLock = await acquireCareerLock(slug);

    expect(firstLock).not.toBeNull();

    const secondLock = await acquireCareerLock(slug);

    expect(secondLock).toBeNull();

    await releaseCareerLock(firstLock!);
  });

  it("allows another request after the owner releases the lock", async () => {
    const firstLock = await acquireCareerLock(slug);

    expect(firstLock).not.toBeNull();

    const released = await releaseCareerLock(
      firstLock!,
    );

    expect(released).toBe(true);

    const secondLock = await acquireCareerLock(slug);

    expect(secondLock).not.toBeNull();

    await releaseCareerLock(secondLock!);
  });

  it("does not allow a different token to release the lock", async () => {
    const lock = await acquireCareerLock(slug);

    expect(lock).not.toBeNull();

    const fakeLock = {
      key: lock!.key,
      token: crypto.randomUUID(),
    };

    const released = await releaseCareerLock(
      fakeLock,
    );

    expect(released).toBe(false);

    const stillExists = await redis.get(
      lock!.key,
    );

    expect(stillExists).toBe(lock!.token);

    await releaseCareerLock(lock!);
  });
});
