import tempy from 'tempy';
import { createTestRepo } from 'test-monorepo-generator';
import execa from 'execa';
import hasha from 'hasha';

import { walkSync } from '@nodelib/fs.walk';
import { join } from 'path';

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

describe('end to end test', () => {
  const tempDir = tempy.directory();
  const seed = 'abcd';
  let fingerprint: string[];

  beforeAll(async () => {
    const version = '1.2.1';
    await createTestRepo({ destination: tempDir, seed, withTurbo: true });
    await execa('yarn', ['add', '-W', '-D', 'oao', `turbo@${version}`], {
      cwd: tempDir,
      reject: true,
    });

    await execa(
      'yarn',
      ['oao', 'run-script', '--tree', '--parallel', 'build'],
      {
        cwd: tempDir,
        reject: true,
      },
    );

    fingerprint = getRepoFingerprint(tempDir);
    console.log(fingerprint);
  }, 30_000);

  it('bops', async () => {
    const buildResult1 = await execa('yarn', ['turbo', 'run', 'build'], {
      cwd: tempDir,
      reject: true,
    });
    const updatedFingerprint1 = getRepoFingerprint(tempDir);

    expect(buildResult1.stdout).toContain('32 successful, 32 total');
    expect(buildResult1.stdout).toContain('0 cached, 32 total');
    expect(updatedFingerprint1).toEqual(fingerprint);

    const buildResult2 = await execa('yarn', ['turbo', 'run', 'build'], {
      cwd: tempDir,
      reject: true,
    });
    const updatedFingerprint2 = getRepoFingerprint(tempDir);

    expect(buildResult2.stdout).toContain('FULL TURBO');
    expect(updatedFingerprint2).toEqual(fingerprint);
  }, 30_000);
});
