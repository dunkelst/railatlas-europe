// GitHub Pages serves the same UI below a repository path; Sites uses /.
export function runtime() {
  return typeof window === 'undefined' ? {} : window.__RAILATLAS_CONFIG__ || {};
}
export function assetUrl(path, config = runtime()) {
  return (config.basePath || '/') + path.replace(/^\/+/, '');
}
export function apiUrl(path, config = runtime()) {
  if (config.requiresApiOrigin && !config.apiOrigin) throw Error('Für die Live-Auskunft bitte die Adresse deines RailAtlas-Servers eintragen.');
  return (config.apiOrigin || '') + '/' + path.replace(/^\/+/, '');
}
export function normalizeApiOrigin(value) {
  const url = new URL(value.trim());
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error('Bitte eine HTTPS-Serveradresse ohne Pfad oder Zugangsdaten eingeben. Lokal ist http://localhost erlaubt.');
  return url.origin;
}
export function restoreApiOrigin() {
  const config = runtime();
  if (!config.requiresApiOrigin) return;
  try {const saved = localStorage.getItem('railatlas-api-origin'); if (saved) config.apiOrigin = normalizeApiOrigin(saved);} catch {/* Storage can be disabled. */}
}
export function saveApiOrigin(value) {
  const config = runtime(), origin = value ? normalizeApiOrigin(value) : '';
  config.apiOrigin = origin;
  try {if (origin) localStorage.setItem('railatlas-api-origin', origin); else localStorage.removeItem('railatlas-api-origin');} catch {/* The current tab still works. */}
  return origin;
}
