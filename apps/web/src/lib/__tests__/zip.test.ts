import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { createZip } from '../zip';

describe('createZip', () => {
  it('produces a real ZIP that round-trips', () => {
    const zip = createZip([
      { name: 'part-001.pdf', data: new TextEncoder().encode('%PDF-1.4 part one') },
      { name: 'part-002.pdf', data: new TextEncoder().encode('%PDF-1.4 part two') },
    ]);

    // Valid ZIP magic bytes.
    expect(zip[0]).toBe(0x50); // P
    expect(zip[1]).toBe(0x4b); // K

    const unzipped = unzipSync(zip);
    expect(strFromU8(unzipped['part-001.pdf'])).toBe('%PDF-1.4 part one');
    expect(strFromU8(unzipped['part-002.pdf'])).toBe('%PDF-1.4 part two');
  });
});
