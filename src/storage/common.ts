import { join } from 'path';
import invariant from 'ts-invariant';

export function getWriteTestData() {
  const filename = `tirbi-temp-${Math.round(Math.random() * 100000)}`;
  return { filename, body: `Test file contents for ${filename}` };
}

// https://nodejs.org/en/knowledge/file-system/security/introduction/#preventing-directory-traversal
export function buildPath(root: string, filename: string) {
  invariant(root.endsWith('/'), 'Root path must end with a slash');
  const full = join(root, filename);
  invariant(full.startsWith(root), 'Possible directory traversal detected');
  return full;
}
