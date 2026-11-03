// Read intrinsic PNG/JPEG dimensions at build time; do not guess screenshot ratios.
export function rasterSize(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16) === 'IHDR') {
    const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
    if (width && height) return {width,height};
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const frames = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
    let at=2;
    while (at < bytes.length) {
      if (bytes[at++] !== 0xff) break;
      while (bytes[at] === 0xff) at++;
      const marker=bytes[at++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
      if (at+2 > bytes.length) break;
      const length=bytes.readUInt16BE(at);
      if (length < 2 || at+length > bytes.length) break;
      if (frames.has(marker) && length >= 8) {
        const height=bytes.readUInt16BE(at+3),width=bytes.readUInt16BE(at+5);
        if (width && height) return {width,height};
      }
      at+=length;
    }
  }
  throw new Error('Cannot read a valid PNG/JPEG image size.');
}
