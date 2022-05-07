import invariant from 'ts-invariant';
import { join } from 'path';
import type { Readable } from 'stream';
import { createReadStream, existsSync } from 'fs';
import { stat, writeFile } from 'fs/promises';
import { Bucket, Storage } from '@google-cloud/storage';
import { pipeline } from 'stream/promises';
import toStream from 'to-readable-stream';
import getStream from 'get-stream';
import lruCache from 'lru-cache';

export interface CacheStorage {
  exists(filename: string): Promise<boolean>;
  read(filename: string): Readable | Buffer;
  write(filename: string, body: Readable | Buffer): Promise<void>;
}

// https://nodejs.org/en/knowledge/file-system/security/introduction/#preventing-directory-traversal
function buildPath(root: string, filename: string) {
  invariant(root.endsWith('/'), 'Root path must end with a slash');
  const full = join(root, filename);
  invariant(full.startsWith(root), 'Possible directory traversal detected');
  return full;
}

/**
 * Verify that the gcp storage client is allowed to create, read, and delete
 * files from the storage bucket
 */
export async function checkGcpBucketPermissions(bucket: Bucket): Promise<void> {
  const testFileName = `tirbi-temp-${Math.round(Math.random() * 100000)}`;
  const expectedContents = `Test file contents for ${testFileName}`;

  const [bucketExists] = await bucket.exists();
  if (!bucketExists) {
    throw new Error(`Bucket doesn't exist: "${bucket.name}"`);
  }

  const testFile = bucket.file(testFileName);

  const [existsBeforeWrite] = await testFile.exists();
  if (existsBeforeWrite) {
    throw new Error("File shouldn't exist yet");
  }

  await pipeline(toStream(expectedContents), testFile.createWriteStream());
  const [existsAfterWrite] = await testFile.exists();
  if (!existsAfterWrite) {
    throw new Error('File should exist');
  }

  const actualContents = await getStream(testFile.createReadStream());
  if (actualContents !== expectedContents) {
    throw new Error('Unexpected file contents');
  }

  await testFile.delete();

  const [existsAfterDelete] = await testFile.exists();
  if (existsAfterDelete) {
    throw new Error('Was not able to delete');
  }
}

export async function gcpCacheStorage(
  bucketName: string,
): Promise<CacheStorage> {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);

  await checkGcpBucketPermissions(bucket);

  return {
    async exists(filename) {
      const file = bucket.file(filename);
      const [exists] = await file.exists();
      return exists;
    },

    async write(filename, body) {
      const file = bucket.file(filename);
      const stream = file.createWriteStream();
      await pipeline(body, stream);
    },

    read(filename) {
      const file = bucket.file(filename);
      return file.createReadStream();
    },
  };
}

export async function fsCacheStorage(rawRoot: string): Promise<CacheStorage> {
  const root = rawRoot.endsWith('/') ? rawRoot : `${rawRoot}/`;
  if (!existsSync(root)) {
    throw new Error(`Storage directory doesn't exist: "${root}"`);
  }

  const pathInfo = await stat(root);
  if (!pathInfo.isDirectory()) {
    throw new Error(`Storage path is not a directory: "${root}"`);
  }

  return {
    exists(filename) {
      const path = buildPath(root, filename);
      return Promise.resolve(existsSync(path));
    },

    read(filename) {
      const path = buildPath(root, filename);
      return createReadStream(path);
    },

    async write(filename, body) {
      const path = buildPath(root, filename);
      await writeFile(path, body);
    },
  };
}

const ONE_MB_IN_BYTES = 1_000_000;

export async function memoryCacheStorage(
  maxSize?: number,
): Promise<CacheStorage> {
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
