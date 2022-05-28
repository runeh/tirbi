import tempy from 'tempy';
import { createTestRepo } from 'test-monorepo-generator';
import execa from 'execa';
import hasha from 'hasha';

import { walkSync } from '@nodelib/fs.walk';
import { join } from 'path';

function getRepoFingerprint(pth: string) {
  const paths = walkSync(pth, {
    basePath: '',
    deepFilter: (entry) => entry.name !== 'node_modules',
    entryFilter: (entry) => entry.name !== 'node_modules',
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
  // let expected;

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

    const fingerprint = getRepoFingerprint(tempDir);
    console.log(fingerprint);
  }, 30_000);

  it('bops', () => {
    console.log(tempDir);
  });
});
