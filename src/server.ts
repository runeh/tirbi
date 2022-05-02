import fastify from 'fastify';
import { IncomingMessage } from 'http';
import { FileStorage } from './storage';
import bearerAuthPlugin from '@fastify/bearer-auth';

export function createServer(config: { token: string; storage: FileStorage }) {
  const server = fastify({ logger: true });
  const { token, storage } = config;

  server.register(bearerAuthPlugin, { keys: new Set([token]) });

  server.get<{
    Headers: {};
    Params: { hash: string };
  }>('/v8/artifacts/:hash', async (req, reply) => {
    const exists = await storage.exists(req.params.hash);
    if (exists) {
      return storage.read(req.params.hash);
    } else {
      reply.status(404);
      return 'not found';
    }
  });

  server.addContentTypeParser(
    'application/octet-stream',
    (req, payload, done) => {
      // fixme: too naive I guess
      done(null, payload);
    },
  );

  server.put<{
    Headers: {};
    Params: { hash: string };
    Body: IncomingMessage;
  }>('/v8/artifacts/:hash', async (req, reply) => {
    await storage.write(req.params.hash, req.body);
    reply.status(204);
  });

  return server;
}
