import { Bucket, Storage } from '@google-cloud/storage';
import { getWriteTestData } from './common';
import { pipeline } from 'stream/promises';
import toStream from 'to-readable-stream';
import getStream from 'get-stream';
import type { CacheStorage } from './types';

/**
 * Verify that the gcp storage client is allowed to create, read, and delete
 * files from the storage bucket
 */
async function checkGcpBucketPermissions(bucket: Bucket): Promise<void> {
  const { filename, body } = getWriteTestData();

  const [bucketExists] = await bucket.exists();
  if (!bucketExists) {
    throw new Error(`Bucket doesn't exist: "${bucket.name}"`);
  }

  const testFile = bucket.file(filename);

  const [existsBeforeWrite] = await testFile.exists();
  if (existsBeforeWrite) {
    throw new Error("File shouldn't exist yet");
  }

  await pipeline(toStream(body), testFile.createWriteStream());
  const [existsAfterWrite] = await testFile.exists();
  if (!existsAfterWrite) {
    throw new Error('File should exist');
  }

  const actualContents = await getStream(testFile.createReadStream());
  if (actualContents !== body) {
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
