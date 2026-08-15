const ZWSP = '\u200b';
const ZWNJ = '\u200c';

function xorBytes(text, key) {
  if (!key) return text;
  const out = [];
  for (let i = 0; i < text.length; i += 1) {
    out.push(String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length)));
  }
  return out.join('');
}

export function encodeWhitespace(payload) {
  const bits = [...payload].map((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  return `SERAPHIM-WS\n${[...bits].map((b) => (b === '1' ? '\t' : ' ')).join('')}`;
}

export function decodeWhitespace(carrier) {
  const body = carrier.startsWith('SERAPHIM-WS') ? carrier.split('\n').slice(1).join('\n') : carrier;
  const bits = [...body].filter((c) => c === ' ' || c === '\t').map((c) => (c === '\t' ? '1' : '0')).join('');
  let out = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    out += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
  }
  return out;
}

export function encodeUnicode(payload) {
  const bits = [...payload].map((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  return `Visible cover text.${[...bits].map((b) => (b === '1' ? ZWSP : ZWNJ)).join('')}`;
}

export function decodeUnicode(carrier) {
  const bits = [...carrier].filter((c) => c === ZWSP || c === ZWNJ).map((c) => (c === ZWSP ? '1' : '0')).join('');
  let out = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    out += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
  }
  return out;
}

export function encodeWordShift(payload) {
  const bits = [...payload].map((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  const words = 'the quick brown fox jumps over the lazy dog again today'.split(' ');
  let text = 'Cover:';
  for (let i = 0; i < bits.length; i += 1) {
    text += ` ${words[i % words.length]}${bits[i] === '1' ? '  ' : ' '}`;
  }
  return text.trim();
}

export function decodeWordShift(carrier) {
  const parts = carrier.replace(/^Cover:\s*/, '').split(/(\s+)/).filter(Boolean);
  let bits = '';
  for (let i = 1; i < parts.length; i += 2) {
    bits += parts[i].length > 1 ? '1' : '0';
  }
  let out = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    out += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
  }
  return out;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) {
    crc ^= b;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

export function embedPngText(pngBuffer, payload) {
  const buf = Buffer.isBuffer(pngBuffer) ? pngBuffer : Buffer.from(pngBuffer);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buf.length < 16 || !buf.subarray(0, 8).equals(sig)) {
    return Buffer.concat([
      Buffer.from('SERAPHIM1'),
      u32(Buffer.byteLength(payload)),
      Buffer.from(payload, 'utf8'),
      buf,
    ]);
  }
  const keyword = Buffer.from('Seraphim\0');
  const data = Buffer.concat([keyword, Buffer.from(payload, 'utf8')]);
  const type = Buffer.from('tEXt');
  const crc = u32(crc32(Buffer.concat([type, data])));
  const chunk = Buffer.concat([u32(data.length), type, data, crc]);
  const iend = buf.lastIndexOf(Buffer.from('IEND'));
  if (iend < 4) return Buffer.concat([buf, chunk]);
  return Buffer.concat([buf.subarray(0, iend - 4), chunk, buf.subarray(iend - 4)]);
}

export function extractPngText(raw) {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (buf.subarray(0, 9).toString() === 'SERAPHIM1') {
    const len = buf.readUInt32BE(9);
    return buf.subarray(13, 13 + len).toString('utf8');
  }
  let offset = 8;
  while (offset + 12 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === 'tEXt') {
      const z = data.indexOf(0);
      const key = data.subarray(0, z).toString();
      if (key === 'Seraphim') return data.subarray(z + 1).toString('utf8');
    }
    if (type === 'IEND') break;
    offset += 12 + len;
  }
  return '';
}

export function encodePayload(method, hidden, key) {
  const payload = xorBytes(hidden, key);
  if (method === 'whitespace') return encodeWhitespace(payload);
  if (method === 'unicode') return encodeUnicode(payload);
  if (method === 'word_shift') return encodeWordShift(payload);
  return payload;
}

export function decodePayload(method, carrier, key) {
  let extracted = '';
  if (method === 'whitespace') extracted = decodeWhitespace(carrier);
  else if (method === 'unicode') extracted = decodeUnicode(carrier);
  else if (method === 'word_shift') extracted = decodeWordShift(carrier);
  else extracted = carrier;
  return xorBytes(extracted, key);
}
