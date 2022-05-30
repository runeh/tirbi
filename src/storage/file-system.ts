import { createReadStream, existsSync } from 'fs';
import { readFile, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { buildPath, getWriteTestData } from './common';
import type { CacheStorage } from './types';

export async function fsCacheStorage(rawRoot: string): Promise<CacheStorage> {
  const root = rawRoot.endsWith('/') ? rawRoot : `${rawRoot}/`;
  if (!existsSync(root)) {
    throw new Error(`Storage directory doesn't exist: "${root}"`);
  }

  const pathInfo = await stat(root);
  if (!pathInfo.isDirectory()) {
    throw new Error(`Storage path is not a directory: "${root}"`);
  }

  const { filename, body } = getWriteTestData();
  const testPath = join(root, filename);
  await writeFile(testPath, body);

  if (!existsSync(testPath)) {
    throw new Error(`Test file could not be written: "${root}"`);
  }

  const readData = await readFile(testPath, 'utf-8');
  if (readData !== body) {
    throw new Error('Body of test file did not match');
  }

  await unlink(testPath);
  if (existsSync(testPath)) {
    throw new Error(`Test file could not be deleted: "${root}"`);
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
