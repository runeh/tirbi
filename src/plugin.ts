import type { IncomingMessage } from 'http';
import bearerAuthPlugin from '@fastify/bearer-auth';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { StorageOptions } from './common';
import { fsCacheStorage, gcpCacheStorage, memoryCacheStorage } from './storage';
import { s3CacheStorage } from './storage/s3';

export interface TirbiOptions {
  tokens: string[];
  storage: StorageOptions;
}

function initStorage(instance: FastifyInstance, options: StorageOptions) {
  switch (options.kind) {
    case 'gs': {
      instance.log.info(`Setting up GCP cache storage: ${options.bucket}`);
      return gcpCacheStorage(options.bucket);
    }

    case 'fs': {
      instance.log.info(
        `Setting up file system cache storage: ${options.path}`,
      );
      return fsCacheStorage(options.path);
    }

    case 'memory': {
      const mbString = options.sizeMb ? `${options.sizeMb}MB` : 'default';
      instance.log.info(
        `Setting up in-memory cache storage. Max size: ${mbString}`,
      );
      return memoryCacheStorage(options.sizeMb);
    }

    case 's3': {
      return s3CacheStorage({ bucket: options.bucket });
    }
  }
}

const tirbiPluginCallback: FastifyPluginAsync<TirbiOptions> = async (
  instance,
  options,
) => {
  // Not been able to get the types to insist on passing in an options object,
  // thus we warn in this case.
  if (Object.keys(options).length === 0) {
    instance.log.warn(
      'No options used when registering tirbi plugin. Using defaults',
    );
    options = { tokens: [], storage: { kind: 'memory' } };
  }

  instance.log.info(
    { ...options, tokens: '[redacted]' },
    `Initializing tirbi plugin`,
  );

  const storage = await initStorage(instance, options.storage);

  if (options.tokens.length) {
    await instance.register(bearerAuthPlugin, {
      keys: new Set(options.tokens),
    });
  } else {
    instance.log.warn('tirbi started without token authorization!');
  }

  instance.get<{
    Params: { hash: string };
  }>('/v8/artifacts/:hash', async (req, reply) => {
    const exists = await storage.exists(req.params.hash);
    if (exists) {
      const data = await storage.read(req.params.hash);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      reply.send(data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      reply.code(404).send();
    }
  });

  instance.addContentTypeParser(
    'application/octet-stream',
    (_, payload, done) => done(null, payload),
  );

  instance.put<{
    Params: { hash: string };
    Body: IncomingMessage;
  }>('/v8/artifacts/:hash', async (req, reply) => {
    await storage.write(req.params.hash, req.body);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    reply.status(204).send();
  });
};

export const tirbiPlugin = fp(tirbiPluginCallback, {
  fastify: '3.x',
  name: 'tirbi',
});
