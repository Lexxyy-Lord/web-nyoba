import { env } from "@/lib/env";

class GlobalProviderRateLimiter {
  private timestamps: number[] = [];
  private queue = Promise.resolve();

  schedule<T>(task: () => Promise<T>) {
    const run = this.queue.then(async () => {
      const now = Date.now();
      this.timestamps = this.timestamps.filter((time) => now - time < env().RUMAHOTP_RATE_WINDOW_MS);
      if (this.timestamps.length >= env().RUMAHOTP_MAX_REQUESTS) {
        const delay = env().RUMAHOTP_RATE_WINDOW_MS - (now - this.timestamps[0]) + 25;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      this.timestamps.push(Date.now());
      return task();
    });
    this.queue = run.then(() => undefined, () => undefined);
    return run;
  }
}

export const rumahOtpRateLimiter = new GlobalProviderRateLimiter();
