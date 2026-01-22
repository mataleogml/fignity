import crypto from 'crypto'

export function generateContentHash(
  content: string,
  style: string,
  x: number,
  y: number
): string {
  // Round coordinates to avoid floating point issues
  const roundedX = Math.round(x * 100) / 100
  const roundedY = Math.round(y * 100) / 100

  const payload = `${content}|${style}|${roundedX}|${roundedY}`
  return crypto.createHash('md5').update(payload).digest('hex')
}
