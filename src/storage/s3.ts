import type { Readable } from 'stream';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import invariant from 'ts-invariant';
import type { BinaryData, CacheStorage } from './types';

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

async function readCacheObject(opts: CommandOpts): Promise<BinaryData> {
  const { bucket, client, key } = opts;
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  const { Body: body } = await client.send(command);
  invariant(body, 'Missing body');
  invariant(
    !(body instanceof ReadableStream),
    'ReadableStream not supported as return value from s3 yet',
  );

  if (body instanceof Blob) {
    const arrayBuffer = await body.arrayBuffer();
    return Buffer.from(new Uint8Array(arrayBuffer));
  }

  return body;
}

export function s3CacheStorage(opts: { bucket: string }): CacheStorage {
  // fixme: add code to verify that the bucket can be read and written to.
  // fixme: add code to deal with region and other settings.
  const { bucket } = opts;
  const client = new S3Client({});
  const baseOpts: Omit<CommandOpts, 'key'> = { bucket, client };

  return {
    exists: async (key) => {
      return checkIfExistsCacheObject({ ...baseOpts, key });
    },

    read: async (key) => {
      return readCacheObject({ ...baseOpts, key });
    },

    write: async (key, data) => {
      await writeCacheObject({ ...baseOpts, key }, data);
    },
  };
}
