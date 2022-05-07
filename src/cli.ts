import { Command, Option, runExit, UsageError } from 'clipanion';
import * as t from 'typanion';
import { parseStorageUrl } from './common';
import type { StorageDef } from './server';
import { createServer } from './server';

const isPort = t.cascade(t.isNumber(), [
  t.isInteger(),
  t.isInInclusiveRange(1, 65535),
]);

const defaultHost = '0.0.0.0';
const defaultPort = 8080;
const defaultStorage: StorageDef = { kind: 'memory' };

class MainCommand extends Command {
  port = Option.String('--port', { required: false, validator: isPort });
  storage = Option.String('--storage', { required: false });
  token = Option.Array('--token', { required: true });

  static usage = Command.Usage({});
  async execute() {
    let storageDef: StorageDef | undefined = undefined;

    if (this.storage) {
      const parsed = parseStorageUrl(this.storage);
      if (parsed) {
        storageDef = parsed;
      } else {
        throw new UsageError(`Invalid storage specifier: ${this.storage}`);
      }
    }

    const server = await createServer({
      token: this.token[0],
      storageDef: storageDef ?? defaultStorage,
    });
    await server.listen(this.port ?? defaultPort, defaultHost);
  }
}

runExit(MainCommand);
