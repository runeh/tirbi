import { createServer, StorageDef } from './server';
import { cleanEnv, host, makeValidator, port, str } from 'envalid';
import { parseStorageUrl } from './common';

const storage = makeValidator<StorageDef>((raw) => {
  const parsed = parseStorageUrl(raw);
  if (parsed) {
    return parsed;
  } else {
    throw new Error(`Invalid format of storage config: "${raw}"`);
  }
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
  const server = await createServer({ token: TOKEN, storageDef: STORAGE_URL });
  await server.listen(PORT, HOST);
}

main();
