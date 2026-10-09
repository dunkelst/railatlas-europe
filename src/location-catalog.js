import { searchLocations, validateLocationIndex } from './location-index.js';

function fold(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function validateLocationCatalog(manifest) {
  if (!manifest || manifest.schema !== 'railatlas.location-catalog/1' || !Array.isArray(manifest.shards)) {
    throw new Error('Unsupported RailAtlas location catalog');
  }
  return manifest;
}

export async function loadLocationCatalog(url, fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Location catalog load failed: ${response.status}`);
  const manifest = validateLocationCatalog(await response.json());
  const baseUrl = new URL(url, globalThis.location?.href ?? 'http://localhost/');
  return createLocationCatalog(manifest, baseUrl, fetchImpl);
}

export function createLocationCatalog(manifest, baseUrl, fetchImpl = fetch) {
  validateLocationCatalog(manifest);
  const shardById = new Map(manifest.shards.map(shard => [shard.id, shard]));
  const cache = new Map();

  async function loadShard(id) {
    if (cache.has(id)) return cache.get(id);
    const shard = shardById.get(id);
    if (!shard) return null;
    const promise = (async () => {
      const url = new URL(shard.path, baseUrl);
      const response = await fetchImpl(url);
      if (!response.ok) throw new Error(`Location shard load failed (${id}): ${response.status}`);
      return validateLocationIndex(await response.json());
    })();
    cache.set(id, promise);
    try {
      return await promise;
    } catch (error) {
      cache.delete(id);
      throw error;
    }
  }

  function candidateShardIds(query) {
    const q = fold(query);
    if (!q) return [];
    const prefix = q.slice(0, Math.min(2, q.length));
    const hinted = manifest.prefixes?.[prefix];
    if (Array.isArray(hinted) && hinted.length) return hinted.filter(id => shardById.has(id));
    return manifest.shards.map(shard => shard.id);
  }

  async function search(query, { limit = 8 } = {}) {
    const ids = candidateShardIds(query);
    const indexes = (await Promise.all(ids.map(loadShard))).filter(Boolean);
    if (!indexes.length) return [];
    const merged = {
      schema: 'railatlas.locations/1',
      locations: indexes.flatMap(index => index.locations)
    };
    return searchLocations(merged, query, { limit });
  }

  return {
    manifest,
    search,
    loadShard,
    loadedShardIds: () => [...cache.keys()]
  };
}
