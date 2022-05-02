import { createServer } from './server';
import { FileStorage, fsFileStorage, gcpFileStorage } from './storage';
import { cleanEnv, makeValidator, port, str, host } from 'envalid';
import { URL } from 'url';

type StorageDef = { kind: 'gs'; bucket: string } | { kind: 'fs'; path: string };

const storage = makeValidator<StorageDef>((raw) => {
  try {
    const url = new URL(raw);
    if (url.protocol === 'gs:') {
      return { kind: 'gs', bucket: `${url.host}${url.pathname}` };
    } else if (url.protocol === 'file:') {
      if (url.host !== '') {
        throw new Error('file url should not include hostname');
      }

      return { kind: 'fs', path: url.pathname };
    }
  } catch (err) {
    throw err;
  }

  throw new Error(`Invalid format of storage config: "${raw}"`);
});

function loadConfig() {
  return cleanEnv(process.env, {
    PORT: port({
      devDefault: 3132,
      desc: 'Port to listen on',
    }),
    TOKEN: str(),
    STORAGE_URL: storage({
      desc: 'URL of cache storage',
      example: `File system: file:/tmp/cache, GCP: gs://gcp-bucket-name/cache`,
    }),
    HOST: host({
      default: '0.0.0.0',
    }),
  });
}

async function main() {
  const { PORT, TOKEN, HOST, STORAGE_URL } = loadConfig();
  let storage: FileStorage;

  if (STORAGE_URL.kind === 'gs') {
    storage = await gcpFileStorage(STORAGE_URL.bucket);
  } else {
    storage = await fsFileStorage(STORAGE_URL.path);
  }

  const server = await createServer({ token: TOKEN, storage });
  await server.listen(PORT, HOST);
}

main();
