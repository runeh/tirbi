import fastify from 'fastify';
import type { FastifyPluginAsync } from 'fastify';
import type { IncomingMessage } from 'http';
import type { CacheStorage } from './storage';
import bearerAuthPlugin from '@fastify/bearer-auth';
import fp from 'fastify-plugin';
import { fsCacheStorage, gcpCacheStorage, memoryCacheStorage } from './storage';

export type StorageDef =
  | { kind: 'gs'; bucket: string }
  | { kind: 'fs'; path: string }
  | { kind: 'memory'; maxMegabytes?: number };

const storagePluginCallback: FastifyPluginAsync<{
  storageDef: StorageDef;
}> = async (instance, opts) => {
  const { storageDef } = opts;
  let cacheStorage: CacheStorage;

  switch (storageDef.kind) {
    case 'gs': {
      instance.log.info(`Setting up GCP cache storage: ${storageDef.bucket}`);
      cacheStorage = await gcpCacheStorage(storageDef.bucket);
      break;
    }

    case 'fs': {
      instance.log.info(
        `Setting up file system cache storage: ${storageDef.path}`,
      );
      cacheStorage = await fsCacheStorage(storageDef.path);
      break;
    }

    case 'memory': {
      const mbString = storageDef.maxMegabytes
        ? `${storageDef.maxMegabytes}MB`
        : 'default';
      instance.log.info(
        `Setting up in-memory cache storage. Max size: ${mbString}`,
      );
      cacheStorage = await memoryCacheStorage(storageDef.maxMegabytes);
      break;
    }

    default: {
      throw new Error('Bad switch case');
    }
  }

  instance.decorate('cacheStorage', cacheStorage);
};

const storagePlugin = fp(storagePluginCallback, '3.x');

declare module 'fastify' {
  interface FastifyInstance {
    cacheStorage: CacheStorage;
  }
}

export function createServer(config: {
  tokens: string[];
  storageDef: StorageDef;
}) {
  const server = fastify({ logger: true });
  server.log.info({ ...config, tokens: '[redacted]' }, `Creating tirbi server`);

  const { storageDef, tokens } = config;
  if (tokens.length) {
    server.register(bearerAuthPlugin, { keys: new Set(tokens) });
  } else {
    server.log.warn('Starting server without token authorization!');
  }
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
    (_req, payload, done) => {
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
