export type StorageConfig =
  | { kind: 'gs'; bucket: string }
  | { kind: 'fs'; path: string }
  | { kind: 'memory'; sizeMb?: number };

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
export function parseStorageUri(raw: string): StorageConfig | null {
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
      const rawSizeMb = Number(url.searchParams.get('sizeMb'));
      const sizeMb =
        isNaN(rawSizeMb) || rawSizeMb === 0 ? undefined : rawSizeMb;
      return sizeMb ? { kind: 'memory', sizeMb } : { kind: 'memory' };
    }

    default: {
      return null;
    }
  }
}
