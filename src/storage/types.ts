import type { Readable } from 'stream';

export type BinaryData = Readable | Buffer;

export interface CacheStorage {
  exists(filename: string): Promise<boolean>;
  read(filename: string): BinaryData | Promise<BinaryData>;
  write(filename: string, body: BinaryData): Promise<void>;
}
