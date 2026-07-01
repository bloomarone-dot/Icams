export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hasPassword(hash)) return false
  return (await hashPassword(password)) === hash
}

export function hasPassword(hash: string | undefined): boolean {
  return !!hash && hash.length > 0
}
