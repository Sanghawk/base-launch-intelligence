export type WorkerConfig = {
  nodeEnv: string;
  pollIntervalMs: number;
  candidateLimit: number;
};

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

export function loadWorkerConfig(): WorkerConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    pollIntervalMs: readPositiveIntegerEnv('WORKER_POLL_INTERVAL_MS', 180000),
    candidateLimit: readPositiveIntegerEnv('WORKER_CANDIDATE_LIMIT', 50)
  };
}
