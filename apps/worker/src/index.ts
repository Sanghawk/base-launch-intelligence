import type { ChainId } from '@base-launch-intelligence/shared';

import { loadWorkerConfig } from './config.js';
import { logger } from './logger.js';
import { startPlaceholderWorkerLoop } from './loop.js';

const baseChainId: ChainId = 8453;
const config = loadWorkerConfig();

logger.info('Base Launch Intelligence worker starting', {
  nodeEnv: config.nodeEnv,
  chainId: baseChainId
  // todo: add client status here
});

const stopWorkerLoop = startPlaceholderWorkerLoop(config);

function shutdown(signal: NodeJS.Signals) {
  logger.info('Worker shutdown requested', {
    signal
  });

  stopWorkerLoop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
