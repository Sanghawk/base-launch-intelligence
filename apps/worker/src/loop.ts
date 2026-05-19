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
    placeholderTickIntervalMs: config.placeholderTickIntervalMs
  });

  runPlaceholderTick();

  const interval = setInterval(() => {
    runPlaceholderTick();
  }, config.placeholderTickIntervalMs);

  return () => {
    clearInterval(interval);

    logger.info('Stopped worker placeholder loop', {
      tickCount
    });
  };
}
