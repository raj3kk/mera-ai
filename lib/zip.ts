/**
 * Minimal dependency-free ZIP writer (stored entries, no compression).
 * Enough for "download my project" — every OS unzips it natively.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

class Writer {
  bytes: number[] = [];
  u16(v: number) {
    this.bytes.push(v & 0xff, (v >>> 8) & 0xff);
  }
  u32(v: number) {
    this.bytes.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  }
  raw(b: Uint8Array) {
    for (let i = 0; i < b.length; i++) this.bytes.push(b[i]);
  }
}

export interface ZipEntry {
  path: string;
  content: string;
}

export function createZip(files: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const out = new Writer();
  const central = new Writer();
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.path.replace(/\\/g, "/"));
    const data = enc.encode(f.content);
    const crc = crc32(data);

    // local file header
    out.u32(0x04034b50);
    out.u16(20); // version needed
    out.u16(0x0800); // UTF-8 flag
    out.u16(0); // method: stored
    out.u16(0); // mod time
    out.u16(0); // mod date
    out.u32(crc);
    out.u32(data.length);
    out.u32(data.length);
    out.u16(name.length);
    out.u16(0); // extra len
    out.raw(name);
    out.raw(data);

    // central directory entry
    central.u32(0x02014b50);
    central.u16(20); // version made by
    central.u16(20); // version needed
    central.u16(0x0800);
    central.u16(0);
    central.u16(0);
    central.u16(0);
    central.u32(crc);
    central.u32(data.length);
    central.u32(data.length);
    central.u16(name.length);
    central.u16(0);
    central.u16(0);
    central.u16(0);
    central.u16(0);
    central.u32(0); // external attrs
    central.u32(offset);
    central.raw(name);

    offset += 30 + name.length + data.length;
  }

  const centralStart = offset;
  const centralSize = central.bytes.length;
  out.raw(Uint8Array.from(central.bytes));

  // end of central directory
  out.u32(0x06054b50);
  out.u16(0);
  out.u16(0);
  out.u16(files.length);
  out.u16(files.length);
  out.u32(centralSize);
  out.u32(centralStart);
  out.u16(0);

  return Uint8Array.from(out.bytes);
}
