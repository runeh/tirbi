import { createTestRepo } from 'test-monorepo-generator';
import { join } from 'path';
import { walkSync } from '@nodelib/fs.walk';
import del from 'del';
import execa from 'execa';
import fastify from 'fastify';
import hasha from 'hasha';
import tempy from 'tempy';
import type { FastifyInstance } from 'fastify';
import { tirbiPlugin } from '../src';

function getRepoFingerprint(pth: string) {
  const paths = walkSync(pth, {
    basePath: '',
    deepFilter: (entry) =>
      entry.name !== 'node_modules' && entry.name !== '.turbo',
    entryFilter: (entry) =>
      entry.name !== 'node_modules' && entry.name !== '.turbo',
  })
    .filter((e) => e.dirent.isFile())
    .map((e) => ({
      path: e.path,
      hash: hasha.fromFileSync(join(pth, e.path), { algorithm: 'md5' }),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return paths.map((e) => `${e.path.padEnd(48, ' ')} ${e.hash}`);
}

describe.each([
  '1.2.1',
  '1.2.2',
  '1.2.3',
  '1.2.4',
  '1.2.5',
  '1.2.6',
  '1.2.7',
  '1.2.8',
  '1.2.9',
  '1.2.10',
  '1.2.11',
  '1.2.12',
  '1.2.13',
  '1.2.14',
])('test turbo@%s ', (version) => {
  const seed = 'abcd';
  let tempDir: string;
  let fingerprint: string[];
  let server: FastifyInstance;
  let apiUrl: string;
  let getOkCount: number;
  let getNotFoundCount: number;
  let putCount: number;

  beforeAll(async () => {
    tempDir = tempy.directory();
    getOkCount = 0;
    getNotFoundCount = 0;
    putCount = 0;

    await createTestRepo({ destination: tempDir, seed, withTurbo: true });
    await execa('yarn', ['add', '-W', '-D', 'oao', `turbo@${version}`], {
      cwd: tempDir,
      reject: true,
    });

    await execa(
      'yarn',
      ['oao', 'run-script', '--tree', '--parallel', 'build'],
      { cwd: tempDir, reject: true },
    );

    fingerprint = getRepoFingerprint(tempDir);

    server = fastify();
    server.register(tirbiPlugin, {
      storage: { kind: 'memory' },
      tokens: ['test'],
    });
    server.addHook('onResponse', async (request, reply) => {
      if (request.method === 'GET') {
        if (reply.statusCode === 200) {
          getOkCount++;
        } else if (reply.statusCode === 404) {
          getNotFoundCount++;
        }
      } else if (request.method === 'PUT') {
        putCount++;
      }
    });

    apiUrl = await server.listen(0);
  }, 30_000);

  afterAll(async () => {
    await del(tempDir, { force: true });
    await server.close();
  });

  it('submits data when cache is cold', async () => {
    const buildResult = await execa(
      'yarn',
      [
        'turbo',
        'run',
        'build',
        '--remote-only',
        '--team=nope',
        '--token=test',
        `--api=${apiUrl}`,
      ],
      { cwd: tempDir, reject: true },
    );
    const updatedFingerprint1 = getRepoFingerprint(tempDir);

    expect(buildResult.stdout).toContain('32 successful, 32 total');
    expect(buildResult.stdout).toContain('0 cached, 32 total');
    expect(updatedFingerprint1).toEqual(fingerprint);
    expect(getOkCount).toEqual(0);
    expect(getNotFoundCount).toEqual(32);
    expect(putCount).toEqual(32);
  });

  it('uses cached data when cache is warm', async () => {
    const buildResult = await execa(
      'yarn',
      [
        'turbo',
        'run',
        'build',
        '--remote-only',
        '--team=nope',
        '--token=test',
        `--api=${apiUrl}`,
      ],
      { cwd: tempDir, reject: true },
    );
    const updatedFingerprint2 = getRepoFingerprint(tempDir);
    expect(updatedFingerprint2).toEqual(fingerprint);
    expect(buildResult.stdout).toContain('FULL TURBO');
    expect(getOkCount).toEqual(32);
    expect(getNotFoundCount).toEqual(32);
    expect(putCount).toEqual(32);
  }, 30_000);
});
