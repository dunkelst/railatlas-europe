function fold(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('de-DE')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function terms(location) {
  return [location.name, ...(location.aliases ?? [])]
    .map(fold)
    .filter(Boolean);
}

function scoreLocation(location, query) {
  const q = fold(query);
  if (!q) return null;
  let best = Infinity;
  for (const value of terms(location)) {
    if (value === q) best = Math.min(best, 0);
    else if (value.startsWith(q)) best = Math.min(best, 10 + value.length - q.length);
    else {
      const word = value.split(' ').findIndex(part => part.startsWith(q));
      if (word >= 0) best = Math.min(best, 30 + word);
      else {
        const offset = value.indexOf(q);
        if (offset >= 0) best = Math.min(best, 50 + offset);
      }
    }
  }
  return Number.isFinite(best) ? best : null;
}

export function validateLocationIndex(index) {
  if (!index || index.schema !== 'railatlas.locations/1' || !Array.isArray(index.locations)) {
    throw new Error('Unsupported RailAtlas location index');
  }
  return index;
}

export async function loadLocationIndex(url, fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Location index load failed: ${response.status}`);
  return validateLocationIndex(await response.json());
}

export function searchLocations(index, query, { limit = 8 } = {}) {
  validateLocationIndex(index);
  return index.locations
    .map(location => ({ location, score: scoreLocation(location, query) }))
    .filter(item => item.score !== null)
    .sort((a, b) => a.score - b.score || a.location.name.localeCompare(b.location.name))
    .slice(0, limit)
    .map(item => item.location);
}

export function resolveLocation(index, query) {
  const matches = searchLocations(index, query, { limit: 2 });
  if (!matches.length) return null;
  const q = fold(query);
  const exact = matches.filter(location => terms(location).includes(q));
  return exact.length === 1 ? exact[0] : null;
}
