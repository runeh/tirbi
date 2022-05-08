import type { Readable } from 'stream';
import getStream from 'get-stream';
import lruCache from 'lru-cache';
import invariant from 'ts-invariant';
import type { CacheStorage } from './types';

const ONE_MB_IN_BYTES = 1_000_000;

export function memoryCacheStorage(maxSize?: number): CacheStorage {
  maxSize = maxSize ?? ONE_MB_IN_BYTES * 128;
  const cache = new lruCache<string, Buffer>({
    maxSize,
    sizeCalculation: (buf) => buf.length,
    updateAgeOnGet: true,
  });

  return {
    exists(filename: string): Promise<boolean> {
      return Promise.resolve(cache.has(filename));
    },

    read(filename: string): Readable | Buffer {
      const data = cache.get(filename);
      invariant(data, `No data for cache key ${filename}`);
      return data;
    },

    async write(filename, body): Promise<void> {
      if (Buffer.isBuffer(body)) {
        cache.set(filename, body);
      } else {
        const buf = await getStream.buffer(body);
        cache.set(filename, buf);
      }
    },
  };
}
