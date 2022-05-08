import type { StorageDef } from './server';

/**
 * Returns the return value of a function, or null if the function threw
 */
function throwing<T>(fun: () => T): T | null {
  try {
    return fun();
  } catch {
    return null;
  }
}

/**
 * Parse a storage URL. Return null if not a valid URL.
 * Will never throw.
 * @param raw
 */
export function parseStorageUrl(raw: string): StorageDef | null {
  const url = throwing(() => new URL(raw));
  if (!url) {
    return null;
  }

  switch (url.protocol) {
    case 'gs': {
      return { kind: 'gs', bucket: `${url.host}${url.pathname}` };
    }

    case 'file:': {
      if (url.host !== '') {
        return null;
      }

      return { kind: 'fs', path: url.pathname };
    }

    case 'memory:': {
      const rawMaxSize = Number(url.searchParams.get('maxMegabytes'));
      const maxMegabytes =
        isNaN(rawMaxSize) || rawMaxSize === 0 ? undefined : rawMaxSize;

      return maxMegabytes
        ? { kind: 'memory', maxMegabytes }
        : { kind: 'memory' };
    }

    default: {
      return null;
    }
  }
}
