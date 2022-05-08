import type { Readable } from 'stream';

export interface CacheStorage {
  exists(filename: string): Promise<boolean>;
  read(filename: string): (Readable | Buffer) | Promise<Readable | Buffer>;
  write(filename: string, body: Readable | Buffer): Promise<void>;
}
