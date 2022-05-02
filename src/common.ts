import type { StorageDef } from './server';

/**
 * Guaranteed not to throw!
 */
export function parseStorageUrl(raw: string): StorageDef | null {
  try {
    const url = new URL(raw);
    if (url.protocol === 'gs:') {
      return { kind: 'gs', bucket: `${url.host}${url.pathname}` };
    } else if (url.protocol === 'file:') {
      if (url.host !== '') {
        return null;
      }

      return { kind: 'fs', path: url.pathname };
    } else if (url.protocol === 'memory:') {
      const rawMaxSize = Number(url.searchParams.get('maxMegabytes'));
      const maxMegabytes =
        isNaN(rawMaxSize) || rawMaxSize === 0 ? undefined : rawMaxSize;
      return { kind: 'memory', maxMegabytes };
    }
  } catch (err) {}
  return null;
}
