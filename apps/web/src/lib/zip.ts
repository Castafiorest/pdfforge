import { zipSync, type Zippable } from 'fflate';

/**
 * Create a real ZIP archive in the browser (uses fflate).
 */
export function createZip(
  files: { name: string; data: Uint8Array }[],
): Uint8Array {
  const entries: Zippable = {};
  for (const file of files) {
    entries[file.name] = new Uint8Array(file.data);
  }
  return zipSync(entries, { level: 6 });
}
