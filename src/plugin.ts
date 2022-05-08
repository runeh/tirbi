import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { IncomingMessage } from 'http';
import { fsCacheStorage, memoryCacheStorage, gcpCacheStorage } from './storage';
import bearerAuthPlugin from '@fastify/bearer-auth';
import fp from 'fastify-plugin';
import type { StorageConfig } from './common';

export interface TirbiConfig {
  tokens: string[];
  storageConfig: StorageConfig;
}

function initStorage(instance: FastifyInstance, storageConfig: StorageConfig) {
  switch (storageConfig.kind) {
    case 'gs': {
      instance.log.info(
        `Setting up GCP cache storage: ${storageConfig.bucket}`,
      );
      return gcpCacheStorage(storageConfig.bucket);
    }

    case 'fs': {
      instance.log.info(
        `Setting up file system cache storage: ${storageConfig.path}`,
      );
      return fsCacheStorage(storageConfig.path);
    }

    case 'memory': {
      const mbString = storageConfig.maxMegabytes
        ? `${storageConfig.maxMegabytes}MB`
        : 'default';
      instance.log.info(
        `Setting up in-memory cache storage. Max size: ${mbString}`,
      );
      return memoryCacheStorage(storageConfig.maxMegabytes);
    }
  }
}

const tirbiPluginCallback: FastifyPluginAsync<TirbiConfig> = async (
  instance,
  config,
) => {
  // fixme: this shouldn't be necessary. Can we get typescript to insist on
  // passing in valid args?
  if (Object.keys(config).length === 0) {
    instance.log.warn(
      'No configuration used when registiring tirbi. Using defaults',
    );
    config = { tokens: [], storageConfig: { kind: 'memory' } };
  }
  const { storageConfig, tokens } = config;

  instance.log.info(
    { ...config, tokens: '[redacted]' },
    `Initializing tirbi plugin`,
  );

  const storage = await initStorage(instance, storageConfig);

  if (tokens.length) {
    instance.register(bearerAuthPlugin, { keys: new Set(tokens) });
  } else {
    instance.log.warn('tirbi configured without token authorization!');
  }

  instance.get<{
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

  instance.addContentTypeParser(
    'application/octet-stream',
    (_req, payload, done) => {
      // fixme: too naive I guess
      done(null, payload);
    },
  );

  instance.put<{
    Headers: {};
    Params: { hash: string };
    Body: IncomingMessage;
  }>('/v8/artifacts/:hash', async (req, reply) => {
    await storage.write(req.params.hash, req.body);
    reply.status(204);
  });
};

export const tirbiPlugin = fp(tirbiPluginCallback, {
  fastify: '3.x',
  name: 'tirbi',
});