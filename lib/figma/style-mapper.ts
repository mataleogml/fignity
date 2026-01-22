export function mapFontSizeToStyle(fontSize: number): string {
  if (fontSize >= 32) return 'Heading L'
  if (fontSize >= 24) return 'Heading M'
  if (fontSize >= 18) return 'Heading S'
  if (fontSize >= 14) return 'Body M'
  return 'Body S'
}
