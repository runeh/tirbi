import type { Readable } from 'stream';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import invariant from 'ts-invariant';
import type { CacheStorage } from './types';

interface CommandOpts {
  client: S3Client;
  bucket: string;
  key: string;
}

async function checkIfExistsCacheObject(opts: CommandOpts) {
  const { bucket, client, key } = opts;
  const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
  const res = await client.send(command);
  return res.$metadata.httpStatusCode === 204;
}

async function writeCacheObject(opts: CommandOpts, stream: Readable | Buffer) {
  const { bucket, client, key } = opts;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: stream,
  });

  await client.send(command);
}

async function readCacheObject(opts: CommandOpts) {
  const { bucket, client, key } = opts;
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  const res = await client.send(command);
  invariant(res.Body, 'Missing body');
  return res.Body;
}

async function s3CacheStorage(opts: { bucket: string }): Promise<CacheStorage> {
  const client = new S3Client({});

  const baseOpts: Omit<CommandOpts, 'key'> = {
    bucket: opts.bucket,
    client,
  };

  return {
    exists: async (key) => {
      return checkIfExistsCacheObject({ ...baseOpts, key });
    },

    read: async (key) => {
      return readCacheObject({ ...baseOpts, key });
    },

    write: async (key, data) => {
      const res = await writeCacheObject({ ...baseOpts, key }, data);
    },
  };
}
