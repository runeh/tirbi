#!/usr/bin/env node

import { InvalidArgumentError, Option, program } from 'commander';
import fastify, { FastifyInstance } from 'fastify';
import { StorageConfig, parseStorageUri } from './common';
import { tirbiPlugin } from './plugin';

const defaultHost = '0.0.0.0';
const defaultPort = 8080;
const defaultStorage: StorageConfig = { kind: 'memory' };

function parsePortArg(raw: string) {
  const port = Number(raw);
  if (isNaN(port)) {
    throw new InvalidArgumentError('Port must be a number');
  }

  if (port < 1 || port > 65535) {
    throw new InvalidArgumentError('Port must be in range 1-65535');
  }
  return port;
}

function parseStorageArg(raw: string) {
  const parsed = parseStorageUri(raw);
  if (!parsed) {
    throw new InvalidArgumentError('Invalid storage URI');
  }
}

const exampleText = `
Example:

Run a tirbi server on port 3131, allowing calls using "s3cret" and "secr3t" as
bearer tokens and saving assets to the "turborepo" folder in a Google Storage
bucket named "ci-caches".

  $ tirbi --port 3131 --host 0.0.0.0 \\
          --token s3cret --token secr3t \\
          --storage gs://ci-caches/turborepo

Storage URIs:

The following storage URI formats are allowed:

- gs://bucket-name/folder - a Google cloud storage bucket with optional folder.
- fs:/tmp/assets - the '/tmp/assets' folder on the local disk
- memory:// - in-memory storage.
- memory://?sizeMb=256 - in-memory storage with a max storage size

Running the program with no arguments starts a tirbi server on port 8080 that
allows any bearer token and stores artifacts in memory.
`;

program
  .name('tirbi')
  .addOption(
    new Option('-p, --port <port>', 'Port to listen to')
      .argParser(parsePortArg)
      .default(defaultPort)
      .env('PORT'),
  )
  .addOption(
    new Option('-h, --host <host>', 'Host to bind to')
      .default(defaultHost)
      .env('HOST'),
  )
  .addOption(
    new Option('-t, --token <token...>', 'One or more auth tokens')
      .default(undefined, 'Accepts any token')
      .env('TOKEN'),
  )
  .addOption(
    new Option('-s, --storage <URI>', 'Storage backend')
      .default(defaultStorage, 'in-memory storage')
      .argParser(parseStorageArg)
      .env('STORAGE'),
  )
  .version('1.0.0-beta1', '-v, --version', 'show tirbi version')
  .addHelpText('after', exampleText);

interface ParseOptions {
  port: number;
  host: string;
  storage: StorageConfig;
  token?: string[];
}

function shutdown(
  server: FastifyInstance,
  signal: string,
  gracePeriodMs: number,
) {
  server.log.info({ signal: signal }, `Received signal ${signal}`);
  setTimeout(() => {
    server.log.warn('Could not gracefully close server within grace period');
    server.log.info('Exiting');
    process.exit(0);
  }, gracePeriodMs);
  server.close(() => {
    server.log.info('Exiting');
    process.exit(0);
  });
}

async function main() {
  program.parse();
  // Not really typesafe, but good enough
  const { token, host, storage, port }: ParseOptions = program.opts();
  const server = fastify({ logger: true });
  await server.register(tirbiPlugin, { storage, tokens: token ?? [] });

  // Try to shutdown properly. If there are pending requests after 5 seconds,
  // just shut down the process
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      shutdown(server, signal, 5000);
    });
  }

  await server.listen(port, host);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
