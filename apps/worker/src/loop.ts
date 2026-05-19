import type { WorkerConfig } from './config.js';
import { logger } from './logger.js';

let tickCount = 0;

function runPlaceholderTick() {
  tickCount += 1;

  logger.info('Worker placeholder loop tick', {
    tickCount
  });
}

export function startPlaceholderWorkerLoop(config: WorkerConfig) {
  logger.info('Starting worker placeholder loop', {
    pollIntervalMs: config.pollIntervalMs,
    candidateLimit: config.candidateLimit
  });

  runPlaceholderTick();

  const interval = setInterval(() => {
    runPlaceholderTick();
  }, config.pollIntervalMs);

  return () => {
    clearInterval(interval);

    logger.info('Stopped worker placeholder loop', {
      tickCount
    });
  };
}
