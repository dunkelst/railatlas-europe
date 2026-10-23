// GitHub Pages serves the same UI below a repository path; Sites uses /.
function runtime() {
  return typeof window === 'undefined' ? {} : window.__RAILATLAS_CONFIG__ || {};
}
export function assetUrl(path, config = runtime()) {
  return (config.basePath || '/') + path.replace(/^\/+/, '');
}
export function apiUrl(path, config = runtime()) {
  return (config.apiOrigin || '') + '/' + path.replace(/^\/+/, '');
}
