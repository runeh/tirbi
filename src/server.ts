import fastify from 'fastify';
import type { FastifyPluginAsync } from 'fastify';
import type { IncomingMessage } from 'http';
import type { FileStorage } from './storage';
import bearerAuthPlugin from '@fastify/bearer-auth';
import fp from 'fastify-plugin';
import { fsFileStorage, gcpFileStorage } from './storage';

export type StorageDef =
  | { kind: 'gs'; bucket: string }
  | { kind: 'fs'; path: string };

const storagePluginCallback: FastifyPluginAsync<{
  storageDef: StorageDef;
}> = async (instance, opts) => {
  const { storageDef } = opts;
  let cacheStorage: FileStorage;

  if (storageDef.kind === 'gs') {
    instance.log.info(`Configuring cache storage: ${storageDef}`);
    cacheStorage = await gcpFileStorage(storageDef.bucket);
  } else {
    cacheStorage = await fsFileStorage(storageDef.path);
  }

  instance.decorate('cacheStorage', cacheStorage);
};

const storagePlugin = fp(storagePluginCallback, '3.x');

declare module 'fastify' {
  interface FastifyInstance {
    cacheStorage: FileStorage;
  }
}

export function createServer(config: {
  token: string;
  storageDef: StorageDef;
}) {
  const server = fastify({ logger: true });
  const { storageDef, token } = config;

  server.register(bearerAuthPlugin, { keys: new Set([token]) });
  server.register(storagePlugin, { storageDef });

  server.get<{
    Headers: {};
    Params: { hash: string };
  }>('/v8/artifacts/:hash', async (req, reply) => {
    const exists = await server.cacheStorage.exists(req.params.hash);
    if (exists) {
      return server.cacheStorage.read(req.params.hash);
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
    await server.cacheStorage.write(req.params.hash, req.body);
    reply.status(204);
  });

  return server;
}
