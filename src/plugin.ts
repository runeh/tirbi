import type { IncomingMessage } from 'http';
import bearerAuthPlugin from '@fastify/bearer-auth';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { StorageConfig } from './common';
import { fsCacheStorage, gcpCacheStorage, memoryCacheStorage } from './storage';

export interface TirbiConfig {
  tokens: string[];
  storage: StorageConfig;
}

function initStorage(instance: FastifyInstance, config: StorageConfig) {
  switch (config.kind) {
    case 'gs': {
      instance.log.info(`Setting up GCP cache storage: ${config.bucket}`);
      return gcpCacheStorage(config.bucket);
    }

    case 'fs': {
      instance.log.info(`Setting up file system cache storage: ${config.path}`);
      return fsCacheStorage(config.path);
    }

    case 'memory': {
      const mbString = config.sizeMb ? `${config.sizeMb}MB` : 'default';
      instance.log.info(
        `Setting up in-memory cache storage. Max size: ${mbString}`,
      );
      return memoryCacheStorage(config.sizeMb);
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
    config = { tokens: [], storage: { kind: 'memory' } };
  }

  instance.log.info(
    { ...config, tokens: '[redacted]' },
    `Initializing tirbi plugin`,
  );

  const storage = await initStorage(instance, config.storage);

  if (config.tokens.length) {
    await instance.register(bearerAuthPlugin, { keys: new Set(config.tokens) });
  } else {
    instance.log.warn('tirbi configured without token authorization!');
  }

  instance.get<{
    Params: { hash: string };
  }>('/v8/artifacts/:hash', async (req, reply) => {
    const exists = await storage.exists(req.params.hash);
    if (exists) {
      return storage.read(req.params.hash);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      reply.status(404);
      return '';
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
    Params: { hash: string };
    Body: IncomingMessage;
  }>('/v8/artifacts/:hash', async (req, reply) => {
    await storage.write(req.params.hash, req.body);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    reply.status(204);
    return '';
  });
};

export const tirbiPlugin = fp(tirbiPluginCallback, {
  fastify: '3.x',
  name: 'tirbi',
});
