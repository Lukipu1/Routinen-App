/**
 * Generates a stable, unique identifier. Uses the platform's crypto UUID when
 * available (Node, modern engines) and falls back to an RFC-4122-shaped v4 id
 * built from Math.random — sufficient for local, offline record keys.
 */
export function generateId(): string {
  const cryptoObj: Crypto | undefined = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}
