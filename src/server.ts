import fastify from 'fastify';
import type { FastifyPluginAsync } from 'fastify';
import type { IncomingMessage } from 'http';
import type { CacheStorage } from './storage';
import bearerAuthPlugin from '@fastify/bearer-auth';
import fp from 'fastify-plugin';
import { fsCacheStorage, gcpCacheStorage, memoryCacheStorage } from './storage';
import type { StorageConfig } from './common';

const storagePluginCallback: FastifyPluginAsync<{
  storageConfig: StorageConfig;
}> = async (instance, opts) => {
  const { storageConfig } = opts;
  let cacheStorage: CacheStorage;

  switch (storageConfig.kind) {
    case 'gs': {
      instance.log.info(
        `Setting up GCP cache storage: ${storageConfig.bucket}`,
      );
      cacheStorage = await gcpCacheStorage(storageConfig.bucket);
      break;
    }

    case 'fs': {
      instance.log.info(
        `Setting up file system cache storage: ${storageConfig.path}`,
      );
      cacheStorage = await fsCacheStorage(storageConfig.path);
      break;
    }

    case 'memory': {
      const mbString = storageConfig.maxMegabytes
        ? `${storageConfig.maxMegabytes}MB`
        : 'default';
      instance.log.info(
        `Setting up in-memory cache storage. Max size: ${mbString}`,
      );
      cacheStorage = await memoryCacheStorage(storageConfig.maxMegabytes);
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

export interface ServerConfig {
  tokens: string[];
  storageConfig: StorageConfig;
}

export function createServer(config: ServerConfig) {
  const server = fastify({ logger: true });
  server.log.info({ ...config, tokens: '[redacted]' }, `Creating tirbi server`);

  const { storageConfig, tokens } = config;
  if (tokens.length) {
    server.register(bearerAuthPlugin, { keys: new Set(tokens) });
  } else {
    server.log.warn('Starting server without token authorization!');
  }
  server.register(storagePlugin, { storageConfig });

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
