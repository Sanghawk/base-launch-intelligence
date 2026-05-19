export type WorkerConfig = {
  nodeEnv: string;
  placeholderTickIntervalMs: number;
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
    placeholderTickIntervalMs: readPositiveIntegerEnv(
      'WORKER_PLACEHOLDER_TICK_INTERVAL_MS',
      5000
    )
  };
}
