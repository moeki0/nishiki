const cache = new Map<string, Promise<Record<string, string | null>>>()

export async function fetchImages(names: string[]): Promise<Record<string, string | null>> {
  const key = names.sort().join('|')
  if (cache.has(key)) return cache.get(key)!

  const promise = fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  }).then(r => r.json())

  cache.set(key, promise)
  return promise
}
