import fastify from 'fastify';
import { tirbiPlugin, TirbiConfig } from './plugin';

export function createServer(config: TirbiConfig) {
  const server = fastify({ logger: true });
  server.register(tirbiPlugin, config);
  return server;
}
