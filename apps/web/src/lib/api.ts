/**
 * Temporary mock transport. Every feature's `api.ts` goes through here so the
 * swap to the real backend (apps/api) is one function.
 */
export async function mockRequest<T>(data: T | (() => T), { delay = 250 }: { delay?: number } = {}): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delay))
  const value = typeof data === 'function' ? (data as () => T)() : data
  return structuredClone(value)
}
