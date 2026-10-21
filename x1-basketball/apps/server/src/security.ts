export function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
export class RateLimit {
  private windows = new Map<string, { start: number; count: number }>();
  constructor(private max: number, private periodMs = 1000) {}
  allow(key: string, now: number): boolean {
    let window = this.windows.get(key);
    if (!window || now - window.start >= this.periodMs) {
      window = { start: now, count: 0 };
      this.windows.set(key, window);
    }
    return ++window.count <= this.max;
  }
  remove(key: string) { this.windows.delete(key); }
}

