import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function createPng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    const row = y * stride
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4
      const dx = x + 0.5 - size / 2
      const dy = y + 0.5 - size / 2
      const dist = Math.sqrt(dx * dx + dy * dy)
      const inCircle = dist < size * 0.32
      if (inCircle) {
        raw[i] = 0xc6
        raw[i + 1] = 0xf2
        raw[i + 2] = 0x7a
        raw[i + 3] = 255
      } else {
        raw[i] = rgba[0]
        raw[i + 1] = rgba[1]
        raw[i + 2] = rgba[2]
        raw[i + 3] = 255
      }
    }
  }
  const compressed = zlib.deflateSync(raw)
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const bg = [0x0b, 0x1f, 0x17]
for (const size of [192, 512]) {
  writeFileSync(join(publicDir, `pwa-${size}x${size}.png`), createPng(size, bg))
}
writeFileSync(join(publicDir, 'apple-touch-icon.png'), createPng(180, bg))
console.log('Icons generated')
